// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize, optional } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * /wards:
 *   get:
 *     summary: Get all wards
 *     tags: [Wards]
 */
router.get(
  '/',
  optional,
  asyncHandler(async (_req: any, res: any) => {
    const wards = await prisma.ward.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    ResponseUtil.success(res, 'Wards retrieved successfully', wards);
  })
);

/**
 * @swagger
 * /wards/{id}:
 *   get:
 *     summary: Get ward by ID
 *     tags: [Wards]
 */
router.get(
  '/:id',
  optional,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    const ward = await prisma.ward.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            classes: true,
          },
        },
      },
    });

    if (!ward) {
      return ResponseUtil.notFound(res, 'Ward not found');
    }

    ResponseUtil.success(res, 'Ward retrieved successfully', ward);
  })
);

/**
 * @swagger
 * /wards/{id}/classes:
 *   get:
 *     summary: Get classes by ward
 *     tags: [Wards]
 */
router.get(
  '/:id/classes',
  optional,
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    const classes = await prisma.class.findMany({
      where: {
        wardId: id,
        status: 'ACTIVE',
      },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: {
              where: { status: 'APPROVED' },
            },
          },
        },
      },
    });

    ResponseUtil.success(res, 'Classes retrieved successfully', classes);
  })
);

/**
 * @swagger
 * /wards:
 *   post:
 *     summary: Create a ward
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req: any, res: any) => {
    const { name, description } = req.body;

    const ward = await prisma.ward.create({
      data: { name, description },
    });

    ResponseUtil.created(res, 'Ward created successfully', ward);
  })
);

/**
 * @swagger
 * /wards/{id}:
 *   patch:
 *     summary: Update a ward
 *     tags: [Wards]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const ward = await prisma.ward.update({
      where: { id },
      data: { name, description, isActive },
    });

    ResponseUtil.success(res, 'Ward updated successfully', ward);
  })
);

export default router;
