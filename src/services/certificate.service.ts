import { PrismaClient, Certificate, CertificateStatus } from '@prisma/client';
import crypto from 'crypto';
import progressService from './progress.service';

const prisma = new PrismaClient();

export class CertificateService {
  /**
   * Generate a certificate for a completed enrollment
   */
  async generate(enrollmentId: string): Promise<Certificate> {
    // Verify enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        class: {
          include: {
            instructor: {
              include: {
                user: true,
              },
            },
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        certificate: true,
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.certificate) {
      throw new Error('Certificate already exists for this enrollment');
    }

    // Check if enrollment is completed
    if (enrollment.status !== 'APPROVED' || !enrollment.completedAt) {
      throw new Error('Enrollment must be completed before generating certificate');
    }

    // Check completion requirements
    const completionCheck = await this.checkCompletionRequirements(enrollmentId);
    if (!completionCheck.isComplete) {
      throw new Error(`Cannot generate certificate: ${completionCheck.reason}`);
    }

    // Generate unique certificate code
    const certificateCode = this.generateCertificateCode();

    // Generate certificate URL (placeholder - would integrate with PDF generation service)
    const certificateUrl = await this.generateCertificatePDF(enrollment);

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        enrollmentId,
        certificateUrl,
        certificateCode,
        status: CertificateStatus.ISSUED,
        issueDate: new Date(),
        verificationUrl: `${process.env.FRONTEND_URL}/certificates/verify/${certificateCode}`,
        metadata: {
          studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          className: enrollment.class.name,
          instructorName: `${enrollment.class.instructor.user.firstName} ${enrollment.class.instructor.user.lastName}`,
          completionDate: enrollment.completedAt,
          finalGrade: enrollment.currentGrade,
        },
      },
    });

    // Update enrollment
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        certificateIssued: true,
      },
    });

    return certificate;
  }

  /**
   * Get certificate by ID
   */
  async getById(id: string) {
    return await prisma.certificate.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            class: {
              include: {
                instructor: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get certificate by code (for verification)
   */
  async getByCode(certificateCode: string) {
    return await prisma.certificate.findUnique({
      where: { certificateCode },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            class: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get certificates for a student
   */
  async getByStudent(studentId: string) {
    return await prisma.certificate.findMany({
      where: {
        enrollment: {
          studentId,
        },
      },
      include: {
        enrollment: {
          include: {
            class: {
              select: {
                name: true,
                thumbnail: true,
              },
            },
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  /**
   * Get certificates for a class
   */
  async getByClass(classId: string) {
    return await prisma.certificate.findMany({
      where: {
        enrollment: {
          classId,
        },
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });
  }

  /**
   * Verify a certificate by code
   */
  async verify(certificateCode: string) {
    const certificate = await this.getByCode(certificateCode);

    if (!certificate) {
      return {
        isValid: false,
        message: 'Certificate not found',
      };
    }

    if (certificate.status === CertificateStatus.REVOKED) {
      return {
        isValid: false,
        message: 'Certificate has been revoked',
        reason: certificate.revocationReason,
      };
    }

    if (certificate.expiryDate && new Date() > certificate.expiryDate) {
      return {
        isValid: false,
        message: 'Certificate has expired',
      };
    }

    return {
      isValid: true,
      certificate,
      message: 'Certificate is valid',
    };
  }

  /**
   * Revoke a certificate
   */
  async revoke(certificateId: string, revokedBy: string, reason: string): Promise<Certificate> {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    if (certificate.status === CertificateStatus.REVOKED) {
      throw new Error('Certificate is already revoked');
    }

    return await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: CertificateStatus.REVOKED,
        revokedAt: new Date(),
        revokedBy,
        revocationReason: reason,
      },
    });
  }

  /**
   * Check if student meets completion requirements
   * Uses the 75% Attendance + 25% Assignment Completion formula
   */
  async checkCompletionRequirements(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        class: true,
      },
    });

    if (!enrollment) {
      return { isComplete: false, reason: 'Enrollment not found' };
    }

    // Use the new progress service for the 75/25 formula
    const eligibility = await progressService.checkEligibility(
      enrollment.studentId,
      enrollment.classId
    );

    // Update cached progress fields
    await progressService.updateEnrollmentProgress(enrollmentId);

    return {
      isComplete: eligibility.eligible,
      reason: eligibility.reason,
      progress: eligibility.progress,
      breakdown: eligibility.breakdown,
      minimumRequired: eligibility.minimumRequired,
    };
  }

  /**
   * Generate unique certificate code
   */
  private generateCertificateCode(): string {
    const randomBytes = crypto.randomBytes(8).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `CERT-${timestamp}-${randomBytes}`;
  }

  /**
   * Generate certificate PDF (placeholder - would integrate with PDF generation library)
   */
  private async generateCertificatePDF(enrollment: any): Promise<string> {
    // In production, this would use a library like PDFKit or Puppeteer
    // to generate a beautiful certificate PDF and upload to cloud storage
    
    // For now, return a placeholder URL
    const studentName = `${enrollment.student.user.firstName}_${enrollment.student.user.lastName}`;
    const className = enrollment.class.name.replace(/\s+/g, '_');
    
    return `https://storage.example.com/certificates/${enrollment.id}_${studentName}_${className}.pdf`;
  }

  /**
   * Get certificate statistics
   */
  async getStatistics() {
    const [total, issued, revoked, pending] = await Promise.all([
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: CertificateStatus.ISSUED } }),
      prisma.certificate.count({ where: { status: CertificateStatus.REVOKED } }),
      prisma.certificate.count({ where: { status: CertificateStatus.PENDING } }),
    ]);

    return {
      total,
      issued,
      revoked,
      pending,
    };
  }

  /**
   * Download certificate (generates download link)
   */
  async download(certificateId: string, userId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // Verify user owns this certificate
    if (certificate.enrollment.student.userId !== userId) {
      throw new Error('You do not have permission to download this certificate');
    }

    if (certificate.status === CertificateStatus.REVOKED) {
      throw new Error('Certificate has been revoked and cannot be downloaded');
    }

    // Return certificate URL for download
    return {
      url: certificate.certificateUrl,
      code: certificate.certificateCode,
      filename: `Certificate_${certificate.certificateCode}.pdf`,
    };
  }
}

export default new CertificateService();
