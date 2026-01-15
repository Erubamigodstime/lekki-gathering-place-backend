import { PrismaClient, Lesson } from '@prisma/client';
import { CreateLessonDTO, UpdateLessonDTO, LessonWithRelations } from '../types';

const prisma = new PrismaClient();

// Lazy load cache service to avoid circular dependency
let cacheService: any = null;
const getCacheService = async () => {
  if (!cacheService) {
    try {
      const module = await import('./cache.service');
      cacheService = module.default || module.cacheService;
    } catch (error) {
      // Cache service not available, continue without caching
      return null;
    }
  }
  return cacheService;
};

export class LessonService {
  /**
   * Create a new lesson for a class
   */
  async create(data: CreateLessonDTO): Promise<Lesson> {
    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: data.classId },
    });

    if (!classExists) {
      throw new Error('Class not found');
    }

    // Check if week number already exists for this class
    const existingLesson = await prisma.lesson.findUnique({
      where: {
        classId_weekNumber: {
          classId: data.classId,
          weekNumber: data.weekNumber,
        },
      },
    });

    if (existingLesson) {
      throw new Error(`Week ${data.weekNumber} already exists for this class`);
    }

    return await prisma.lesson.create({
      data: {
        classId: data.classId,
        weekNumber: data.weekNumber,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        completionRequired: data.completionRequired ?? true,
        dueDate: data.dueDate,
        estimatedDuration: data.estimatedDuration,
        orderIndex: data.orderIndex ?? 0,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  /**
   * Get lesson by ID with optional relations
   */
  async getById(id: string, includeRelations = false): Promise<LessonWithRelations | null> {
    const cache = await getCacheService();
    
    // Use cache if available
    if (cache) {
      const cacheKey = cache.keys.lesson(id);
      
      return await cache.getOrSet(
        cacheKey,
        async () => {
          return await prisma.lesson.findUnique({
            where: { id },
            include: includeRelations ? {
              class: true,
              courseMaterials: {
                orderBy: { orderIndex: 'asc' },
              },
              assignments: {
                where: { isPublished: true },
                orderBy: { dueDate: 'asc' },
              },
              weekProgress: {
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
            } : undefined,
          });
        },
        cache.ttl.medium
      );
    }
    
    // Fallback without cache
    return await prisma.lesson.findUnique({
      where: { id },
      include: includeRelations ? {
        class: true,
        courseMaterials: {
          orderBy: { orderIndex: 'asc' },
        },
        assignments: {
          where: { isPublished: true },
          orderBy: { dueDate: 'asc' },
        },
        weekProgress: {
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
      } : undefined,
    });
  }

  /**
   * Get all lessons for a class, ordered by week
   */
  async getByClass(
    classId: string,
    includeUnpublished = false,
    page?: number,
    limit?: number
  ): Promise<Lesson[] | { data: Lesson[]; pagination: any }> {
    const where: any = { classId };
    
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    // If pagination is requested
    if (page && limit) {
      const skip = (page - 1) * limit;
      
      const [lessons, total] = await Promise.all([
        prisma.lesson.findMany({
          where,
          orderBy: { weekNumber: 'asc' },
          include: {
            courseMaterials: {
              orderBy: { orderIndex: 'asc' },
            },
            assignments: {
              where: includeUnpublished ? {} : { isPublished: true },
            },
            _count: {
              select: {
                weekProgress: {
                  where: { completed: true },
                },
              },
            },
          },
          skip,
          take: limit,
        }),
        prisma.lesson.count({ where }),
      ]);

      return {
        data: lessons,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          pageSize: limit,
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrevious: page > 1,
        },
      };
    }

    // Return all lessons without pagination
    return await prisma.lesson.findMany({
      where,
      orderBy: { weekNumber: 'asc' },
      include: {
        courseMaterials: {
          orderBy: { orderIndex: 'asc' },
        },
        assignments: {
          where: includeUnpublished ? {} : { isPublished: true },
        },
        _count: {
          select: {
            weekProgress: {
              where: { completed: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get a specific week's lesson for a class
   */
  async getByWeek(classId: string, weekNumber: number): Promise<Lesson | null> {
    return await prisma.lesson.findUnique({
      where: {
        classId_weekNumber: {
          classId,
          weekNumber,
        },
      },
      include: {
        courseMaterials: {
          orderBy: { orderIndex: 'asc' },
        },
        assignments: {
          where: { isPublished: true },
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  /**
   * Update an existing lesson
   */
  async update(id: string, data: UpdateLessonDTO): Promise<Lesson> {
    const lesson = await prisma.lesson.findUnique({ where: { id } });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // If changing week number, check for conflicts
    if (data.weekNumber && data.weekNumber !== lesson.weekNumber) {
      const existingLesson = await prisma.lesson.findUnique({
        where: {
          classId_weekNumber: {
            classId: lesson.classId,
            weekNumber: data.weekNumber,
          },
        },
      });

      if (existingLesson) {
        throw new Error(`Week ${data.weekNumber} already exists for this class`);
      }
    }

    const updated = await prisma.lesson.update({
      where: { id },
      data: {
        weekNumber: data.weekNumber,
        title: data.title,
        description: data.description,
        videoUrl: data.videoUrl,
        completionRequired: data.completionRequired,
        dueDate: data.dueDate,
        estimatedDuration: data.estimatedDuration,
        orderIndex: data.orderIndex,
        isPublished: data.isPublished,
      },
    });

    // Invalidate caches
    await Promise.all([
      cacheService.del(cacheService.keys.lesson(id)),
      cacheService.del(cacheService.keys.lessonsByClass(lesson.classId)),
      cacheService.invalidateClass(lesson.classId),
    ]);

    return updated;
  }

  /**
   * Publish a lesson (make it visible to students)
   */
  async publish(id: string): Promise<Lesson> {
    const lesson = await prisma.lesson.findUnique({ where: { id }, select: { classId: true } });
    
    const published = await prisma.lesson.update({
      where: { id },
      data: { isPublished: true },
    });

    // Invalidate caches
    if (lesson) {
      await Promise.all([
        cacheService.del(cacheService.keys.lesson(id)),
        cacheService.del(cacheService.keys.lessonsByClass(lesson.classId)),
        cacheService.invalidateClass(lesson.classId),
      ]);
    }

    return published;
  }

  /**
   * Unpublish a lesson (hide from students)
   */
  async unpublish(id: string): Promise<Lesson> {
    return await prisma.lesson.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  /**
   * Delete a lesson (also deletes related materials and assignments via cascade)
   */
  async delete(id: string): Promise<void> {
    const lesson = await prisma.lesson.findUnique({ where: { id } });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    await prisma.lesson.delete({
      where: { id },
    });
  }

  /**
   * Get student progress for a lesson
   */
  async getStudentProgress(lessonId: string, studentId: string) {
    return await prisma.weekProgress.findFirst({
      where: {
        lessonId,
        studentId,
      },
      include: {
        lesson: {
          select: {
            title: true,
            weekNumber: true,
          },
        },
      },
    });
  }



  /**
   * Get completion statistics for a lesson
   */
  async getCompletionStats(lessonId: string) {
    const [totalEnrolled, completed] = await Promise.all([
      prisma.enrollment.count({
        where: {
          class: {
            lessons: {
              some: { id: lessonId },
            },
          },
          status: 'APPROVED',
        },
      }),
      prisma.weekProgress.count({
        where: {
          lessonId,
          completed: true,
        },
      }),
    ]);

    return {
      totalEnrolled,
      completed,
      percentage: totalEnrolled > 0 ? (completed / totalEnrolled) * 100 : 0,
    };
  }

  /**
   * Mark a lesson as complete for a student
   */
  async markComplete(lessonId: string, studentId: string) {
    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        classId: lesson.classId,
        status: 'APPROVED',
      },
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this class');
    }

    // Create or update completion record using enrollmentId_lessonId
    return await prisma.weekProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
      create: {
        enrollmentId: enrollment.id,
        studentId,
        lessonId,
        weekNumber: lesson.weekNumber,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark a lesson as incomplete for a student
   */
  async markIncomplete(lessonId: string, studentId: string) {
    await prisma.weekProgress.deleteMany({
      where: {
        studentId,
        lessonId,
      },
    });
  }

  /**
   * Get all completed lessons for a student
   */
  async getStudentCompletedLessons(studentId: string, classId?: string) {
    const where: any = {
      studentId,
      completed: true,
    };

    if (classId) {
      where.lesson = {
        classId,
      };
    }

    return await prisma.weekProgress.findMany({
      where,
      include: {
        lesson: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });
  }
}

export default new LessonService();
