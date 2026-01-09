import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ResponseUtil } from '../utils/response.util';
import { AppError } from '../middleware/error.middleware';

export class AnnouncementController {
  // Create announcement (Instructor only)
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, priority, classId } = req.body;
      const userId = req.user.id;

      // Verify user is an instructor
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor) {
        throw new AppError('Only instructors can create announcements', 403);
      }

      // Verify instructor teaches this class
      const classExists = await prisma.class.findFirst({
        where: {
          id: classId,
          instructorId: instructor.id,
        },
      });

      if (!classExists) {
        throw new AppError('You can only create announcements for your own classes', 403);
      }

      // Create announcement
      const announcement = await prisma.announcement.create({
        data: {
          title,
          content,
          priority: priority || 'NORMAL',
          classId,
          instructorId: instructor.id,
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
        },
      });

      ResponseUtil.success(res, 'Announcement created successfully', announcement, 201);
    } catch (error) {
      next(error);
    }
  }

  // Get all announcements for a class
  static async getByClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const userId = req.user.id;

      // Verify user has access to this class (enrolled student or teaching instructor)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          instructorProfile: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      let hasAccess = false;

      // Check if user is the instructor
      if (user.instructorProfile) {
        const teachesClass = await prisma.class.findFirst({
          where: {
            id: classId,
            instructorId: user.instructorProfile.id,
          },
        });
        hasAccess = !!teachesClass;
      }

      // Check if user is an enrolled student
      if (!hasAccess && user.studentProfile) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            classId,
            studentId: user.studentProfile.id,
            status: 'APPROVED',
          },
        });
        hasAccess = !!enrollment;
      }

      if (!hasAccess) {
        throw new AppError('You do not have access to this class', 403);
      }

      // Fetch announcements
      const announcements = await prisma.announcement.findMany({
        where: { classId },
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      ResponseUtil.success(res, 'Announcements fetched successfully', announcements);
    } catch (error) {
      next(error);
    }
  }

  // Update announcement (Instructor only)
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, content, priority } = req.body;
      const userId = req.user.id;

      // Verify user is an instructor
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor) {
        throw new AppError('Only instructors can update announcements', 403);
      }

      // Verify announcement belongs to this instructor
      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new AppError('Announcement not found', 404);
      }

      if (announcement.instructorId !== instructor.id) {
        throw new AppError('You can only update your own announcements', 403);
      }

      // Update announcement
      const updatedAnnouncement = await prisma.announcement.update({
        where: { id },
        data: {
          title,
          content,
          priority,
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
        },
      });

      ResponseUtil.success(res, 'Announcement updated successfully', updatedAnnouncement);
    } catch (error) {
      next(error);
    }
  }

  // Delete announcement (Instructor only)
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify user is an instructor
      const instructor = await prisma.instructor.findUnique({
        where: { userId },
      });

      if (!instructor) {
        throw new AppError('Only instructors can delete announcements', 403);
      }

      // Verify announcement belongs to this instructor
      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new AppError('Announcement not found', 404);
      }

      if (announcement.instructorId !== instructor.id) {
        throw new AppError('You can only delete your own announcements', 403);
      }

      // Delete announcement
      await prisma.announcement.delete({
        where: { id },
      });

      ResponseUtil.success(res, 'Announcement deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }

  // Increment view count
  static async incrementViews(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const announcement = await prisma.announcement.update({
        where: { id },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      ResponseUtil.success(res, 'View count updated', announcement);
    } catch (error) {
      next(error);
    }
  }
}
