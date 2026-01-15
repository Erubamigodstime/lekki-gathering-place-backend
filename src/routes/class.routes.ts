// @ts-nocheck
import { Router } from 'express';
import { authenticate, authorize, optional } from '@/middleware/auth.middleware';
import { UserRole } from '@prisma/client';
import prisma from '@/config/database';
import { ResponseUtil } from '@/utils/response.util';
import { asyncHandler } from '@/middleware/error.middleware';
import { PaginationUtil } from '@/utils/pagination.util';

const router = Router();

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Get all classes
 *     tags: [Classes]
 */
router.get(
  '/',
  optional,
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, sortBy, sortOrder } = PaginationUtil.getPaginationParams(req.query);
    const { skip, take } = PaginationUtil.getSkipTake(page, limit);
    const { wardId, instructorId, status } = req.query;

    const where: any = {};
    if (wardId) where.wardId = wardId;
    if (instructorId) where.instructorId = instructorId;
    if (status) where.status = status;

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
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
          ward: true,
          _count: {
            select: {
              enrollments: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    const paginatedResponse = PaginationUtil.createPaginatedResponse(classes, total, page, limit);
    ResponseUtil.success(res, 'Classes retrieved successfully', paginatedResponse);
  })
);

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [Classes]
 */
router.get(
  '/:id',
  optional,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        instructor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        ward: true,
        enrollments: {
          where: { status: 'APPROVED' },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
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

    if (!classData) {
      return ResponseUtil.notFound(res, 'Class not found');
    }

    ResponseUtil.success(res, 'Class retrieved successfully', classData);
  })
);

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Create a new class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, schedule, maxCapacity, instructorId, wardId, thumbnail } = req.body;
    const currentUser = req.user!;

    // If instructor, use their own ID
    const finalInstructorId =
      currentUser.role === UserRole.INSTRUCTOR
        ? (await prisma.instructor.findUnique({ where: { userId: currentUser.id } }))?.id
        : instructorId;

    if (!finalInstructorId) {
      return ResponseUtil.badRequest(res, 'Invalid instructor');
    }

    const classData = await prisma.class.create({
      data: {
        name,
        description,
        schedule,
        maxCapacity,
        instructorId: finalInstructorId,
        wardId,
        createdById: currentUser.id,
        thumbnail,
      },
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
        ward: true,
      },
    });

    ResponseUtil.created(res, 'Class created successfully', classData);
  })
);

/**
 * @swagger
 * /classes/{id}:
 *   patch:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.INSTRUCTOR),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, schedule, maxCapacity, status, thumbnail } = req.body;
    const currentUser = req.user!;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: { instructor: true },
    });

    if (!existingClass) {
      return ResponseUtil.notFound(res, 'Class not found');
    }

    // Check permission
    if (
      currentUser.role === UserRole.INSTRUCTOR &&
      existingClass.instructor.userId !== currentUser.id
    ) {
      return ResponseUtil.forbidden(res, 'You can only update your own classes');
    }

    const classData = await prisma.class.update({
      where: { id },
      data: {
        name,
        description,
        schedule,
        maxCapacity,
        status,
        thumbnail,
      },
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
        ward: true,
      },
    });

    ResponseUtil.success(res, 'Class updated successfully', classData);
  })
);

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Delete a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.class.delete({
      where: { id },
    });

    ResponseUtil.success(res, 'Class deleted successfully');
  })
);

export default router;
