import { PrismaClient, Submission, SubmissionStatus } from '@prisma/client';
import { CreateSubmissionDTO, UpdateSubmissionDTO } from '../types';

const prisma = new PrismaClient();

export class SubmissionService {
  /**
   * Get student by user ID
   */
  async getStudentByUserId(userId: string) {
    return await prisma.student.findUnique({
      where: { userId },
    });
  }

  /**
   * Create a new submission (or save as draft)
   */
  async create(data: CreateSubmissionDTO): Promise<Submission> {
    // Verify assignment exists and is published
    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      include: { lesson: true },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    if (!assignment.isPublished) {
      throw new Error('Assignment is not published yet');
    }

    // Check if student is enrolled in the class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId: assignment.lesson.classId,
        studentId: data.studentId,
        status: 'APPROVED',
      },
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this class');
    }

    // Check if late submission is allowed
    if (assignment.dueDate && new Date() > assignment.dueDate && !assignment.allowLateSubmission) {
      throw new Error('Late submissions are not allowed for this assignment');
    }

    // Get next attempt number
    const latestSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    const attemptNumber = latestSubmission ? latestSubmission.attemptNumber + 1 : 1;

    return await prisma.submission.create({
      data: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
        content: data.content,
        fileUrl: data.fileUrl,
        metadata: data.metadata,
        status: data.status || SubmissionStatus.DRAFT,
        submittedAt: data.status === SubmissionStatus.SUBMITTED ? new Date() : null,
        attemptNumber,
      },
    });
  }

  /**
   * Get submission by ID
   */
  async getById(id: string) {
    return await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            instructions: true,
            maxPoints: true,
            dueDate: true,
            lesson: {
              select: {
                id: true,
                weekNumber: true,
                title: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        student: {
          select: {
            id: true,
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
        grade: {
          select: {
            id: true,
            points: true,
            maxPoints: true,
            percentage: true,
            instructorComment: true,
            feedback: true,
            status: true,
            gradedAt: true,
            publishedAt: true,
            gradedBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get all submissions for an assignment
   */
  async getByAssignment(assignmentId: string, latestOnly = false) {
    if (latestOnly) {
      // OPTIMIZED: Use raw SQL with DISTINCT ON to avoid N+1 query problem
      // This replaces groupBy + Promise.all which was causing 10-100x slowdown
      const latestSubmissions = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT ON (s.student_id) 
          s.*,
          json_build_object(
            'id', st.id,
            'userId', st.user_id,
            'user', json_build_object(
              'firstName', u.first_name,
              'lastName', u.last_name,
              'email', u.email
            )
          ) as student,
          json_build_object(
            'id', g.id,
            'points', g.points,
            'maxPoints', g.max_points,
            'percentage', g.percentage,
            'status', g.status
          ) as grade
        FROM submissions s
        LEFT JOIN students st ON s.student_id = st.id
        LEFT JOIN users u ON st.user_id = u.id
        LEFT JOIN grades g ON s.id = g.submission_id
        WHERE s.assignment_id = ${assignmentId}
        ORDER BY s.student_id, s.attempt_number DESC
      `;

      // Transform to match expected Prisma types
      return latestSubmissions.map(row => ({
        id: row.id,
        assignmentId: row.assignment_id,
        studentId: row.student_id,
        content: row.content,
        fileUrl: row.file_url,
        metadata: row.metadata,
        status: row.status,
        submittedAt: row.submitted_at,
        attemptNumber: row.attempt_number,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        student: row.student,
        grade: row.grade.id ? row.grade : null,
      }));
    }

    return await prisma.submission.findMany({
      where: { assignmentId },
      orderBy: [
        { studentId: 'asc' },
        { attemptNumber: 'desc' },
      ],
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
    });
  }

  /**
   * Get all submissions by class
   */
  async getByClass(classId: string, status?: SubmissionStatus, latestOnly = false) {
    const where: any = {
      assignment: {
        lesson: {
          classId,
        },
      },
    };

    if (status) {
      where.status = status;
    }

    const includeClause = {
      assignment: {
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
      },
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
      grade: true,
    };

    if (latestOnly) {
      // Get unique combinations of student and assignment
      const submissions = await prisma.submission.findMany({
        where,
        include: includeClause,
        orderBy: [
          { studentId: 'asc' },
          { assignmentId: 'asc' },
          { attemptNumber: 'desc' },
        ],
      });

      // Filter to get only the latest submission for each student-assignment combination
      const latestMap = new Map<string, any>();
      submissions.forEach(submission => {
        const key = `${submission.studentId}-${submission.assignmentId}`;
        if (!latestMap.has(key) || submission.attemptNumber > latestMap.get(key).attemptNumber) {
          latestMap.set(key, submission);
        }
      });

      return Array.from(latestMap.values()).sort((a, b) => 
        new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime()
      );
    }

    // Return all submissions sorted by most recent
    return await prisma.submission.findMany({
      where,
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: includeClause,
    });
  }

  /**
   * Get all submissions by a student
   */
  async getByStudent(studentId: string, classId?: string) {
    const where: any = { studentId };

    if (classId) {
      where.assignment = {
        lesson: {
          classId,
        },
      };
    }

    return await prisma.submission.findMany({
      where,
      orderBy: [
        { submittedAt: 'desc' },
        { attemptNumber: 'desc' },
      ],
      include: {
        assignment: {
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
        },
        grade: true,
      },
    });
  }

  /**
   * Update a submission (only allowed if not yet submitted)
   */
  async update(id: string, data: UpdateSubmissionDTO): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== SubmissionStatus.DRAFT && submission.status !== SubmissionStatus.REJECTED) {
      throw new Error('Cannot update submission that has already been submitted');
    }

    const updateData: any = {
      content: data.content,
      fileUrl: data.fileUrl,
      metadata: data.metadata,
      status: data.status,
    };

    // Set submittedAt when status changes to SUBMITTED
    if (data.status === SubmissionStatus.SUBMITTED && submission.status === SubmissionStatus.DRAFT) {
      updateData.submittedAt = new Date();
    }

    return await prisma.submission.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Submit a draft submission
   */
  async submit(id: string): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== SubmissionStatus.DRAFT) {
      throw new Error('Only draft submissions can be submitted');
    }

    return await prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  /**
   * Mark submission as under review (instructor action)
   */
  async markUnderReview(id: string): Promise<Submission> {
    return await prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.UNDER_REVIEW,
      },
    });
  }

  /**
   * Approve a submission (instructor action)
   */
  async approve(id: string): Promise<Submission> {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { grade: true },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (!submission.grade) {
      throw new Error('Cannot approve submission without a grade');
    }

    return await prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.APPROVED,
      },
    });
  }

  /**
   * Reject a submission (instructor action)
   */
  async reject(id: string): Promise<Submission> {
    return await prisma.submission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED,
      },
    });
  }

  /**
   * Delete a submission (only allowed if draft)
   */
  async delete(id: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.status !== SubmissionStatus.DRAFT) {
      throw new Error('Only draft submissions can be deleted');
    }

    await prisma.submission.delete({
      where: { id },
    });
  }

  /**
   * Get submission history for a student on an assignment
   */
  async getHistory(assignmentId: string, studentId: string) {
    return await prisma.submission.findMany({
      where: {
        assignmentId,
        studentId,
      },
      orderBy: {
        attemptNumber: 'asc',
      },
      include: {
        grade: true,
      },
    });
  }

  /**
   * Check if submission is late
   */
  async isLate(id: string): Promise<boolean> {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: true,
      },
    });

    if (!submission || !submission.assignment.dueDate || !submission.submittedAt) {
      return false;
    }

    return submission.submittedAt > submission.assignment.dueDate;
  }
}

export default new SubmissionService();
