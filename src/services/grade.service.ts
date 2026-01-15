import { PrismaClient, Grade, GradeStatus } from '@prisma/client';
import { CreateGradeDTO, UpdateGradeDTO } from '../types';

const prisma = new PrismaClient();

export class GradeService {
  /**
   * Create a grade for a submission
   */
  async create(data: CreateGradeDTO, gradedById: string): Promise<Grade> {
    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: data.submissionId },
      include: {
        assignment: true,
        grade: true,
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.grade) {
      throw new Error('Submission already has a grade');
    }

    // Calculate percentage
    const percentage = (data.points / data.maxPoints) * 100;

    // Create grade
    const grade = await prisma.grade.create({
      data: {
        submissionId: data.submissionId,
        points: data.points,
        maxPoints: data.maxPoints,
        percentage,
        instructorComment: data.instructorComment,
        feedback: data.feedback,
        status: data.status || GradeStatus.PENDING,
        gradedById,
        gradedAt: new Date(),
        publishedAt: data.status === GradeStatus.PUBLISHED ? new Date() : null,
      },
    });

    // Update submission status to GRADED
    await prisma.submission.update({
      where: { id: data.submissionId },
      data: {
        status: 'GRADED',
      },
    });

    // If grade is published, update enrollment total points
    if (data.status === GradeStatus.PUBLISHED) {
      await this.updateEnrollmentPoints(submission.studentId, submission.assignment.lessonId);
    }

    return grade;
  }

  /**
   * Get grade by ID
   */
  async getById(id: string) {
    return await prisma.grade.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            id: true,
            content: true,
            fileUrl: true,
            submittedAt: true,
            attemptNumber: true,
            assignment: {
              select: {
                id: true,
                title: true,
                maxPoints: true,
                lesson: {
                  select: {
                    weekNumber: true,
                    title: true,
                  },
                },
              },
            },
            student: {
              select: {
                id: true,
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
        gradedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get grade by submission ID
   */
  async getBySubmission(submissionId: string) {
    return await prisma.grade.findUnique({
      where: { submissionId },
      include: {
        gradedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all grades by a student
   */
  async getByStudent(studentId: string, classId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const where: any = {
      submission: {
        studentId,
      },
    };

    if (classId) {
      where.submission.assignment = {
        lesson: {
          classId,
        },
      };
    }

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: {
          submission: {
            select: {
              id: true,
              submittedAt: true,
              attemptNumber: true,
              assignment: {
                select: {
                  id: true,
                  title: true,
                  maxPoints: true,
                  lesson: {
                    select: {
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
            },
          },
          gradedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          gradedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.grade.count({ where }),
    ]);

    return {
      data: grades,
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

  /**
   * Get all grades for a class
   */
  async getByClass(classId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = {
      submission: {
        assignment: {
          lesson: {
            classId,
          },
        },
      },
    };

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        include: {
          submission: {
            select: {
              id: true,
              submittedAt: true,
              student: {
                select: {
                  id: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
              assignment: {
                select: {
                  id: true,
                  title: true,
                  maxPoints: true,
                  lesson: {
                    select: {
                      weekNumber: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          gradedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          {
            gradedAt: 'desc',
          },
        ],
        skip,
        take: limit,
      }),
      prisma.grade.count({ where }),
    ]);

    return {
      data: grades,
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

  /**
   * Update an existing grade
   */
  async update(id: string, data: UpdateGradeDTO): Promise<Grade> {
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    // Recalculate percentage if points changed
    const points = data.points ?? grade.points;
    const maxPoints = data.maxPoints ?? grade.maxPoints;
    const percentage = (points / maxPoints) * 100;

    const updateData: any = {
      points,
      maxPoints,
      percentage,
      instructorComment: data.instructorComment,
      feedback: data.feedback,
      status: data.status,
    };

    // Set publishedAt if status changes to PUBLISHED
    if (data.status === GradeStatus.PUBLISHED && grade.status !== GradeStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
      
      // Update enrollment points
      await this.updateEnrollmentPoints(
        grade.submission.studentId,
        grade.submission.assignment.lessonId
      );
    }

    return await prisma.grade.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Publish a grade (make it visible to student)
   */
  async publish(id: string): Promise<Grade> {
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        status: GradeStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Update enrollment points
    await this.updateEnrollmentPoints(
      grade.submission.studentId,
      grade.submission.assignment.lessonId
    );

    return updatedGrade;
  }

  /**
   * Unpublish a grade (hide from student)
   */
  async unpublish(id: string): Promise<Grade> {
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        status: GradeStatus.PENDING,
      },
    });

    // Update enrollment points (remove this grade's contribution)
    await this.updateEnrollmentPoints(
      grade.submission.studentId,
      grade.submission.assignment.lessonId
    );

    return updatedGrade;
  }

  /**
   * Delete a grade
   */
  async delete(id: string): Promise<void> {
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    await prisma.grade.delete({
      where: { id },
    });

    // Update submission status back to SUBMITTED
    await prisma.submission.update({
      where: { id: grade.submissionId },
      data: {
        status: 'SUBMITTED',
      },
    });

    // Update enrollment points
    await this.updateEnrollmentPoints(
      grade.submission.studentId,
      grade.submission.assignment.lessonId
    );
  }

  /**
   * Calculate class average for an assignment
   */
  async getAssignmentAverage(assignmentId: string): Promise<number | null> {
    const result = await prisma.grade.aggregate({
      where: {
        submission: {
          assignmentId,
        },
        status: GradeStatus.PUBLISHED,
      },
      _avg: {
        percentage: true,
      },
    });

    return result._avg.percentage;
  }

  /**
   * Calculate student's overall grade for a class
   */
  async getStudentClassGrade(studentId: string, classId: string) {
    const grades = await prisma.grade.findMany({
      where: {
        submission: {
          studentId,
          assignment: {
            lesson: {
              classId,
            },
          },
        },
        status: GradeStatus.PUBLISHED,
      },
      include: {
        submission: {
          include: {
            assignment: true,
          },
        },
      },
    });

    if (grades.length === 0) {
      return {
        totalPoints: 0,
        earnedPoints: 0,
        percentage: 0,
        letterGrade: 'N/A',
      };
    }

    const totalPoints = grades.reduce((sum, g) => sum + g.maxPoints, 0);
    const earnedPoints = grades.reduce((sum, g) => sum + g.points, 0);
    const percentage = (earnedPoints / totalPoints) * 100;

    return {
      totalPoints,
      earnedPoints,
      percentage,
      letterGrade: this.calculateLetterGrade(percentage),
    };
  }

  /**
   * Update enrollment points and current grade
   */
  private async updateEnrollmentPoints(studentId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) return;

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        classId: lesson.classId,
      },
    });

    if (!enrollment) return;

    const classGrade = await this.getStudentClassGrade(studentId, lesson.classId);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        totalPoints: classGrade.earnedPoints,
        currentGrade: classGrade.percentage,
      },
    });
  }

  /**
   * Calculate letter grade from percentage
   */
  private calculateLetterGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Get grade distribution for a class
   */
  async getGradeDistribution(classId: string) {
    const grades = await prisma.grade.findMany({
      where: {
        submission: {
          assignment: {
            lesson: {
              classId,
            },
          },
        },
        status: GradeStatus.PUBLISHED,
      },
      select: {
        percentage: true,
      },
    });

    const distribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    grades.forEach(grade => {
      const letter = this.calculateLetterGrade(grade.percentage);
      distribution[letter as keyof typeof distribution]++;
    });

    return distribution;
  }

  /**
   * Get complete gradebook for a class (all students × assignments matrix)
   * Used by instructors to view and manage grades
   */
  async getClassGradebook(classId: string) {
    // Get all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        status: 'APPROVED',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        student: {
          user: {
            lastName: 'asc',
          },
        },
      },
    });

    // Get all assignments for this class
    const lessons = await prisma.lesson.findMany({
      where: { classId },
      include: {
        assignments: {
          where: { isPublished: true },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { weekNumber: 'asc' },
    });

    const assignments = lessons.flatMap(lesson => 
      lesson.assignments.map(assignment => ({
        ...assignment,
        lessonTitle: lesson.title,
      }))
    );

    // Get all submissions and grades for this class
    const submissions = await prisma.submission.findMany({
      where: {
        assignment: {
          lesson: {
            classId,
          },
        },
      },
      include: {
        grade: true,
      },
    });

    // Build gradebook matrix
    const gradebook = enrollments.map(enrollment => {
      const studentSubmissions = submissions.filter(
        s => s.studentId === enrollment.studentId
      );

      const assignmentGrades = assignments.map(assignment => {
        const submission = studentSubmissions.find(
          s => s.assignmentId === assignment.id
        );

        if (!submission) {
          return {
            assignmentId: assignment.id,
            status: 'NOT_SUBMITTED',
            grade: null,
          };
        }

        if (!submission.grade) {
          return {
            assignmentId: assignment.id,
            submissionId: submission.id,
            status: 'SUBMITTED',
            grade: null,
          };
        }

        return {
          assignmentId: assignment.id,
          submissionId: submission.id,
          status: submission.grade.status,
          grade: {
            id: submission.grade.id,
            points: submission.grade.points,
            maxPoints: submission.grade.maxPoints,
            percentage: submission.grade.percentage,
            instructorComment: submission.grade.instructorComment,
            gradedAt: submission.grade.gradedAt,
          },
        };
      });

      // Calculate overall grade
      const publishedGrades = assignmentGrades.filter(
        ag => ag.grade && ag.status === 'PUBLISHED'
      );

      let overallGrade = null;
      if (publishedGrades.length > 0) {
        const totalPoints = publishedGrades.reduce(
          (sum, ag) => sum + (ag.grade?.maxPoints || 0),
          0
        );
        const earnedPoints = publishedGrades.reduce(
          (sum, ag) => sum + (ag.grade?.points || 0),
          0
        );
        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

        overallGrade = {
          totalPoints,
          earnedPoints,
          percentage,
          letterGrade: this.calculateLetterGrade(percentage),
        };
      }

      return {
        student: {
          id: enrollment.student.id,
          userId: enrollment.student.user.id,
          firstName: enrollment.student.user.firstName,
          lastName: enrollment.student.user.lastName,
          email: enrollment.student.user.email,
        },
        enrollmentId: enrollment.id,
        assignmentGrades,
        overallGrade,
      };
    });

    return {
      assignments: assignments.map(a => ({
        id: a.id,
        title: a.title,
        lessonTitle: a.lessonTitle,
        maxPoints: a.maxPoints,
        dueDate: a.dueDate,
        type: a.type,
      })),
      students: gradebook,
    };
  }

  /**
   * Bulk publish multiple grades at once
   */
  async bulkPublishGrades(gradeIds: string[]) {
    const grades = await prisma.grade.findMany({
      where: {
        id: { in: gradeIds },
      },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                lesson: true,
              },
            },
          },
        },
      },
    });

    if (grades.length !== gradeIds.length) {
      throw new Error('Some grades not found');
    }

    // Update all grades to published
    await prisma.grade.updateMany({
      where: {
        id: { in: gradeIds },
      },
      data: {
        status: GradeStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Update enrollment points for affected students
    const uniqueStudents = new Map<string, string>();
    grades.forEach(grade => {
      const lessonId = grade.submission.assignment.lessonId;
      uniqueStudents.set(grade.submission.studentId, lessonId);
    });

    for (const [studentId, lessonId] of uniqueStudents) {
      await this.updateEnrollmentPoints(studentId, lessonId);
    }

    return { published: gradeIds.length };
  }
}

export default new GradeService();
