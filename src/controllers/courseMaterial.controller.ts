import { Request, Response, NextFunction } from 'express';
import { PrismaClient, MaterialType } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

/**
 * Create a new course material
 * POST /api/v1/course-materials
 */
export const createCourseMaterial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lessonId, title, fileUrl, type, fileSize, orderIndex } = req.body;

    // Validate required fields
    if (!lessonId || !title || !fileUrl || !type) {
      throw new AppError('Missing required fields: lessonId, title, fileUrl, type', 400);
    }

    // Validate type
    if (!Object.values(MaterialType).includes(type)) {
      throw new AppError(`Invalid material type. Must be one of: ${Object.values(MaterialType).join(', ')}`, 400);
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        class: {
          include: {
            instructor: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Check if user is the instructor of this class
    if (lesson.class.instructor?.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      throw new AppError('Only the class instructor can add materials to lessons', 403);
    }

    // Create course material
    const courseMaterial = await prisma.courseMaterial.create({
      data: {
        lessonId,
        title,
        fileUrl,
        type: type as MaterialType,
        fileSize: fileSize ? parseInt(fileSize) : null,
        orderIndex: orderIndex !== undefined ? parseInt(orderIndex) : 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Course material created successfully',
      data: courseMaterial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all materials for a lesson
 * GET /api/v1/course-materials/lesson/:lessonId
 */
export const getCourseMaterialsByLesson = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { lessonId } = req.params;

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Get materials ordered by orderIndex
    const materials = await prisma.courseMaterial.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
    });

    res.json({
      success: true,
      data: materials,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a course material
 * DELETE /api/v1/course-materials/:id
 */
export const deleteCourseMaterial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get material with lesson info
    const material = await prisma.courseMaterial.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            class: {
              include: {
                instructor: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new AppError('Course material not found', 404);
    }

    // Check if user is the instructor of this class
    if (material.lesson.class.instructor?.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      throw new AppError('Only the class instructor can delete materials', 403);
    }

    // Delete material
    await prisma.courseMaterial.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Course material deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
