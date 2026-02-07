import { PrismaClient } from '@prisma/client';
import { addWeeks, isAfter, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

// Program start date - matches frontend (December 2, 2025)
const PROGRAM_START_DATE = new Date(2025, 11, 2); // December 2, 2025

// Day name to number mapping
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
};

/**
 * Certificate Progress Service
 * 
 * Implements the 75% Attendance + 25% Assignment Completion formula
 * for certificate eligibility tracking.
 */
export class ProgressService {
  /**
   * Generate all class dates from schedule
   */
  private generateClassDates(
    scheduleDays: string[],
    startDate: Date = PROGRAM_START_DATE,
    weeks: number = 12
  ): Date[] {
    const dates: Date[] = [];

    scheduleDays.forEach(dayName => {
      const targetDayNumber = DAY_NAME_TO_NUMBER[dayName] ?? 0;
      
      let currentDate = startOfDay(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
      const startDayNumber = currentDate.getDay();
      
      let daysUntilTarget = targetDayNumber - startDayNumber;
      if (daysUntilTarget < 0) {
        daysUntilTarget += 7;
      }
      
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);
      
      for (let week = 0; week < weeks; week++) {
        const classDate = startOfDay(addWeeks(currentDate, week));
        dates.push(classDate);
      }
    });

    return dates.sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Get the number of class sessions that should have occurred up to today
   */
  private getExpectedSessionsCount(
    classSchedule: { days?: string[] },
    totalWeeks: number = 12
  ): number {
    const scheduleDays = classSchedule?.days || ['Thursday'];
    const allDates = this.generateClassDates(scheduleDays, PROGRAM_START_DATE, totalWeeks);
    const today = startOfDay(new Date());
    
    // Count dates that are on or before today
    return allDates.filter(date => !isAfter(date, today)).length;
  }

  /**
   * Calculate attendance percentage for a student in a class
   * 
   * @returns Score from 0-100
   */
  async calculateAttendancePercentage(studentId: string, classId: string): Promise<{
    score: number;
    attended: number;
    total: number;
    details: string;
  }> {
    // Get class schedule info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        schedule: true,
        totalWeeks: true,
      },
    });

    if (!classInfo) {
      return { score: 0, attended: 0, total: 0, details: 'Class not found' };
    }

    const schedule = classInfo.schedule as { days?: string[] } || { days: ['Thursday'] };
    const totalExpectedSessions = this.getExpectedSessionsCount(schedule, classInfo.totalWeeks);

    if (totalExpectedSessions === 0) {
      return { score: 100, attended: 0, total: 0, details: 'No sessions scheduled yet' };
    }

    // Count APPROVED attendance records
    const approvedAttendance = await prisma.attendance.count({
      where: {
        classId,
        studentId,
        status: 'APPROVED',
      },
    });

    const score = Math.round((approvedAttendance / totalExpectedSessions) * 100);

    return {
      score: Math.min(score, 100), // Cap at 100%
      attended: approvedAttendance,
      total: totalExpectedSessions,
      details: `${approvedAttendance} of ${totalExpectedSessions} sessions attended`,
    };
  }

  /**
   * Calculate assignment completion percentage for a student in a class
   * 
   * Completion = assignments with submission status >= SUBMITTED
   * Published = Assignment.isPublished = true
   * 
   * @returns Score from 0-100
   */
  async calculateAssignmentCompletionPercentage(studentId: string, classId: string): Promise<{
    score: number;
    completed: number;
    total: number;
    details: string;
  }> {
    // Get all published assignments for lessons in this class
    const publishedAssignments = await prisma.assignment.findMany({
      where: {
        isPublished: true,
        lesson: {
          classId,
          isPublished: true,
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const totalAssignments = publishedAssignments.length;

    if (totalAssignments === 0) {
      // No published assignments means 100% for this component
      return { 
        score: 100, 
        completed: 0, 
        total: 0, 
        details: 'No published assignments yet' 
      };
    }

    const assignmentIds = publishedAssignments.map(a => a.id);

    // Count submissions with status >= SUBMITTED (not DRAFT)
    const completedSubmissions = await prisma.submission.count({
      where: {
        studentId,
        assignmentId: { in: assignmentIds },
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW', 'GRADED', 'APPROVED', 'REJECTED'],
        },
      },
    });

    const score = Math.round((completedSubmissions / totalAssignments) * 100);

    return {
      score: Math.min(score, 100), // Cap at 100%
      completed: completedSubmissions,
      total: totalAssignments,
      details: `${completedSubmissions} of ${totalAssignments} assignments submitted`,
    };
  }

  /**
   * Calculate overall progress using the 75/25 formula
   * 
   * Overall Grade = (Attendance % × 0.75) + (Assignment Completion % × 0.25)
   */
  async calculateOverallProgress(studentId: string, classId: string): Promise<{
    overallGrade: number;
    attendanceScore: number;
    assignmentScore: number;
    attendanceDetails: {
      score: number;
      attended: number;
      total: number;
      details: string;
    };
    assignmentDetails: {
      score: number;
      completed: number;
      total: number;
      details: string;
    };
  }> {
    const attendanceDetails = await this.calculateAttendancePercentage(studentId, classId);
    const assignmentDetails = await this.calculateAssignmentCompletionPercentage(studentId, classId);

    // Apply the 75/25 formula
    const attendanceContribution = attendanceDetails.score * 0.75;
    const assignmentContribution = assignmentDetails.score * 0.25;
    const overallGrade = Math.round(attendanceContribution + assignmentContribution);

    return {
      overallGrade,
      attendanceScore: attendanceDetails.score,
      assignmentScore: assignmentDetails.score,
      attendanceDetails,
      assignmentDetails,
    };
  }

  /**
   * Update enrollment progress fields (cached values)
   * Note: This requires the certificate progress migration to be applied.
   * If the fields don't exist yet, it will silently skip the update.
   */
  async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        studentId: true,
        classId: true,
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const progress = await this.calculateOverallProgress(
      enrollment.studentId,
      enrollment.classId
    );

    // Try to update the cached progress fields
    // These fields are optional and may not exist if migration hasn't been applied
    try {
      await prisma.$executeRaw`
        UPDATE enrollments 
        SET 
          "completionProgress" = ${progress.overallGrade},
          "attendanceScore" = ${progress.attendanceScore},
          "assignmentCompletionScore" = ${progress.assignmentScore},
          "progressUpdatedAt" = NOW()
        WHERE id = ${enrollmentId}
      `;
    } catch (error) {
      // If the columns don't exist yet, silently skip
      // The progress will be calculated on-the-fly in checkEligibility
      console.log('Progress caching skipped (migration may not be applied yet)');
    }
  }

  /**
   * Update progress for a student in a class (finds enrollment automatically)
   */
  async updateProgressByStudentAndClass(studentId: string, classId: string): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        classId_studentId: {
          classId,
          studentId,
        },
      },
    });

    if (enrollment) {
      await this.updateEnrollmentProgress(enrollment.id);
    }
  }

  /**
   * Check certificate eligibility for a student
   */
  async checkEligibility(studentId: string, classId: string, minimumGrade: number = 60): Promise<{
    eligible: boolean;
    reason: string;
    progress: number;
    breakdown: {
      attendance: {
        score: number;
        attended: number;
        total: number;
        contribution: number;
      };
      assignments: {
        score: number;
        completed: number;
        total: number;
        contribution: number;
      };
    };
    minimumRequired: number;
  }> {
    // Get class completion rules if any
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        completionRules: true,
        gradingEnabled: true,
        totalWeeks: true,
      },
    });

    // Get minimum grade from class rules or use default
    const classRules = classInfo?.completionRules as { minimumGrade?: number } | null;
    const requiredGrade = classRules?.minimumGrade ?? minimumGrade;

    const progress = await this.calculateOverallProgress(studentId, classId);

    const eligible = progress.overallGrade >= requiredGrade;

    let reason: string;
    if (eligible) {
      reason = 'Congratulations! You have met all requirements for certificate eligibility.';
    } else {
      const needed = requiredGrade - progress.overallGrade;
      reason = `You need ${needed}% more to reach the ${requiredGrade}% minimum requirement. Keep attending classes and submitting assignments!`;
    }

    return {
      eligible,
      reason,
      progress: progress.overallGrade,
      breakdown: {
        attendance: {
          score: progress.attendanceDetails.score,
          attended: progress.attendanceDetails.attended,
          total: progress.attendanceDetails.total,
          contribution: Math.round(progress.attendanceDetails.score * 0.75),
        },
        assignments: {
          score: progress.assignmentDetails.score,
          completed: progress.assignmentDetails.completed,
          total: progress.assignmentDetails.total,
          contribution: Math.round(progress.assignmentDetails.score * 0.25),
        },
      },
      minimumRequired: requiredGrade,
    };
  }

  /**
   * Get progress for all students in a class (for instructor view)
   */
  async getClassProgress(classId: string): Promise<Array<{
    studentId: string;
    enrollmentId: string;
    studentName: string;
    email: string;
    overallGrade: number;
    attendanceScore: number;
    assignmentScore: number;
    eligible: boolean;
    progressUpdatedAt: Date | null;
  }>> {
    // Get all approved enrollments
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
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Get class rules for eligibility check
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        completionRules: true,
      },
    });

    const classRules = classInfo?.completionRules as { minimumGrade?: number } | null;
    const minimumGrade = classRules?.minimumGrade ?? 60;

    // Calculate progress for each student
    const progressData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await this.calculateOverallProgress(
          enrollment.studentId,
          classId
        );

        return {
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
          email: enrollment.student.user.email,
          overallGrade: progress.overallGrade,
          attendanceScore: progress.attendanceScore,
          assignmentScore: progress.assignmentScore,
          eligible: progress.overallGrade >= minimumGrade,
          progressUpdatedAt: (enrollment as any).progressUpdatedAt || null,
        };
      })
    );

    // Sort by overall grade descending
    return progressData.sort((a, b) => b.overallGrade - a.overallGrade);
  }
}

export default new ProgressService();
