import prisma from '@/config/database';
import { AuthUtil } from '@/utils/auth.util';
import { AppError } from '@/middleware/error.middleware';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import emailService from '@/services/email.service';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  wardId: string;
  profilePicture?: string;
  classId?: string; // For instructor class assignment
}

interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  async register(data: RegisterData) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Check if ward exists
    const ward = await prisma.ward.findUnique({
      where: { id: data.wardId },
    });

    if (!ward) {
      throw new AppError('Invalid ward ID', 400);
    }

    // Hash password
    const hashedPassword = await AuthUtil.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        wardId: data.wardId,
        profilePicture: data.profilePicture,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        wardId: true,
        status: true,
        createdAt: true,
      },
    });

    // Create role-specific profile
    if (data.role === UserRole.INSTRUCTOR) {
      const instructor = await prisma.instructor.create({
        data: {
          userId: user.id,
          skills: [],
        },
      });

      // If classId is provided, assign instructor to the class
      if (data.classId) {
        await prisma.class.update({
          where: { id: data.classId },
          data: {
            instructorId: instructor.id,
          },
        });
      }
    } else if (data.role === UserRole.STUDENT) {
      const student = await prisma.student.create({
        data: {
          userId: user.id,
        },
      });

      // Auto-enroll in Public Speaking class (mandatory for all students)
      const publicSpeakingClass = await prisma.class.findFirst({
        where: {
          name: 'Public Speaking & Communication Skills',
          status: 'ACTIVE',
        },
      });

      if (publicSpeakingClass) {
        await prisma.enrollment.create({
          data: {
            classId: publicSpeakingClass.id,
            studentId: student.id,
            status: 'APPROVED',
            approvedAt: new Date(),
          },
        });
        console.log(`Auto-enrolled student ${user.email} in Public Speaking class`);
      }
    }

    // Generate tokens
    const accessToken = AuthUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = AuthUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginData, userAgent?: string, ipAddress?: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        ward: true,
        instructorProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await AuthUtil.comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new AppError('Your account is inactive. Please contact support.', 403);
    }

    // Generate tokens
    const accessToken = AuthUtil.generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = AuthUtil.generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    // Verify token (will throw if invalid)
    AuthUtil.verifyRefreshToken(refreshToken);

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Generate new access token
    const accessToken = AuthUtil.generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    return { accessToken };
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { refreshToken },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('This email is not registered. Please sign up to create an account.', 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    // Send password reset email
    try {
      console.log('[AuthService] Attempting to send password reset email to:', user.email);
      await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.firstName
      );
      console.log('[AuthService] Password reset email sent successfully');
    } catch (error: any) {
      console.error('[AuthService] Failed to send password reset email:', error);
      throw new AppError(`Failed to send password reset email: ${error.message}`, 500);
    }

    return {
      message: 'Password reset link has been sent to your email.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Hash new password
    const hashedPassword = await AuthUtil.hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await AuthUtil.comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await AuthUtil.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions except current
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password changed successfully' };
  }
}
