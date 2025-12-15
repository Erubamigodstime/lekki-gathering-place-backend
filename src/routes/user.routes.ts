// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        wardId: true,
        ward: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    ResponseUtil.success(res, 'Users retrieved successfully', users);
  })
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user!;

    // Only allow admins or the user themselves
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      return ResponseUtil.forbidden(res);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        profilePicture: true,
        wardId: true,
        ward: true,
        instructorProfile: true,
        studentProfile: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return ResponseUtil.notFound(res, 'User not found');
    }

    ResponseUtil.success(res, 'User retrieved successfully', user);
  })
);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update my profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { firstName, lastName, phone, profilePicture } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        profilePicture,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profilePicture: true,
        role: true,
        wardId: true,
        ward: true,
      },
    });

    ResponseUtil.success(res, 'Profile updated successfully', user);
  })
);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Update user status (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    ResponseUtil.success(res, 'User status updated successfully', user);
  })
);

export default router;
