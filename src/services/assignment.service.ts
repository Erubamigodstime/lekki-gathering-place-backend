import { PrismaClient, Assignment } from '@prisma/client';
import { CreateAssignmentDTO, UpdateAssignmentDTO } from '../types';

const prisma = new PrismaClient();

export class AssignmentService {
  /**
   * Get student by user ID
   */
  async getStudentByUserId(userId: string) {
    return await prisma.student.findUnique({
      where: { userId },
    });
  }

  /**
   * Create a new assignment for a lesson
   */
  async create(data: CreateAssignmentDTO): Promise<Assignment> {
    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    return await prisma.assignment.create({
      data: {
        lessonId: data.lessonId,
        title: data.title,
        instructions: data.instructions,
        type: data.type,
        maxPoints: data.maxPoints,
        rubric: data.rubric,
        dueDate: data.dueDate,
        allowLateSubmission: data.allowLateSubmission ?? true,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  /**
   * Get assignment by ID with optional relations
   */
  async getById(id: string, includeRelations = false) {
    return await prisma.assignment.findUnique({
      where: { id },
      include: includeRelations ? {
        lesson: {
          include: {
            class: true,
          },
        },
        submissions: {
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
            grade: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      } : undefined,
    });
  }

  /**
   * Get all assignments for a lesson
   */
  async getByLesson(lessonId: string, includeUnpublished = false) {
    const where: any = { lessonId };
    
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    return await prisma.assignment.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  /**
   * Get all assignments for a class
   */
  async getByClass(classId: string, includeUnpublished = false) {
    const where: any = {
      lesson: {
        classId,
      },
    };
    
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    return await prisma.assignment.findMany({
      where,
      orderBy: [
        { lesson: { weekNumber: 'asc' } },
        { dueDate: 'asc' },
      ],
      include: {
        lesson: {
          select: {
            weekNumber: true,
            title: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });
  }

  /**
   * Get assignments for a student (with their submission status)
   */
  async getForStudent(classId: string, studentId: string) {
    const assignments = await prisma.assignment.findMany({
      where: {
        lesson: {
          classId,
        },
        isPublished: true,
      },
      include: {
        lesson: {
          select: {
            weekNumber: true,
            title: true,
          },
        },
        submissions: {
          where: {
            studentId,
          },
          orderBy: {
            attemptNumber: 'desc',
          },
          take: 1,
          include: {
            grade: true,
          },
        },
      },
      orderBy: [
        { lesson: { weekNumber: 'asc' } },
        { dueDate: 'asc' },
      ],
    });

    return assignments.map(assignment => ({
      ...assignment,
      submission: assignment.submissions[0] || null, // Frontend expects 'submission' not 'latestSubmission'
      submissions: undefined, // Remove the array, keep only latest
    }));
  }

  /**
   * Update an existing assignment
   */
  async update(id: string, data: UpdateAssignmentDTO): Promise<Assignment> {
    const assignment = await prisma.assignment.findUnique({ where: { id } });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    return await prisma.assignment.update({
      where: { id },
      data: {
        title: data.title,
        instructions: data.instructions,
        type: data.type,
        maxPoints: data.maxPoints,
        rubric: data.rubric,
        dueDate: data.dueDate,
        allowLateSubmission: data.allowLateSubmission,
        isPublished: data.isPublished,
      },
    });
  }

  /**
   * Publish an assignment (make it visible to students)
   */
  async publish(id: string): Promise<Assignment> {
    return await prisma.assignment.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  /**
   * Unpublish an assignment (hide from students)
   */
  async unpublish(id: string): Promise<Assignment> {
    return await prisma.assignment.update({
      where: { id },
      data: { isPublished: false },
    });
  }

  /**
   * Delete an assignment (also deletes submissions via cascade)
   */
  async delete(id: string): Promise<void> {
    const assignment = await prisma.assignment.findUnique({ where: { id } });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    await prisma.assignment.delete({
      where: { id },
    });
  }

  /**
   * Check if assignment is overdue
   */
  isOverdue(assignment: Assignment): boolean {
    if (!assignment.dueDate) return false;
    return new Date() > new Date(assignment.dueDate);
  }

  /**
   * Get submission statistics for an assignment
   */
  async getSubmissionStats(assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    const [totalEnrolled, submitted, graded] = await Promise.all([
      prisma.enrollment.count({
        where: {
          classId: assignment.lesson.classId,
          status: 'APPROVED',
        },
      }),
      prisma.submission.count({
        where: {
          assignmentId,
          status: {
            in: ['SUBMITTED', 'UNDER_REVIEW', 'GRADED', 'APPROVED'],
          },
        },
      }),
      prisma.submission.count({
        where: {
          assignmentId,
          status: {
            in: ['GRADED', 'APPROVED'],
          },
        },
      }),
    ]);

    return {
      totalEnrolled,
      submitted,
      graded,
      pending: submitted - graded,
      submissionRate: totalEnrolled > 0 ? (submitted / totalEnrolled) * 100 : 0,
      gradingRate: submitted > 0 ? (graded / submitted) * 100 : 0,
    };
  }

  /**
   * Get average score for an assignment
   */
  async getAverageScore(assignmentId: string) {
    const grades = await prisma.grade.findMany({
      where: {
        submission: {
          assignmentId,
        },
        status: 'PUBLISHED',
      },
      select: {
        percentage: true,
      },
    });

    if (grades.length === 0) {
      return null;
    }

    const total = grades.reduce((sum, grade) => sum + grade.percentage, 0);
    return total / grades.length;
  }

  /**
   * Duplicate an assignment to another lesson
   */
  async duplicate(assignmentId: string, targetLessonId: string): Promise<Assignment> {
    const original = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!original) {
      throw new Error('Assignment not found');
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: targetLessonId },
    });

    if (!lesson) {
      throw new Error('Target lesson not found');
    }

    return await prisma.assignment.create({
      data: {
        lessonId: targetLessonId,
        title: `${original.title} (Copy)`,
        instructions: original.instructions,
        type: original.type,
        maxPoints: original.maxPoints,
        rubric: original.rubric,
        dueDate: original.dueDate,
        allowLateSubmission: original.allowLateSubmission,
        isPublished: false, // Unpublished by default
      },
    });
  }
}

export default new AssignmentService();
