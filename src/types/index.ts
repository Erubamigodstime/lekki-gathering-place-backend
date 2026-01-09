export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

// ============================================================================
// CANVAS LMS TYPES
// ============================================================================

import type { Lesson, AssignmentType, SubmissionStatus, MessageType, GradeStatus } from '@prisma/client';

// Lesson DTOs
export interface CreateLessonDTO {
  classId: string;
  weekNumber: number;
  title: string;
  description?: string;
  videoUrl?: string;
  completionRequired?: boolean;
  dueDate?: Date;
  estimatedDuration?: number;
  orderIndex?: number;
  isPublished?: boolean;
}

export interface UpdateLessonDTO {
  weekNumber?: number;
  title?: string;
  description?: string;
  videoUrl?: string;
  completionRequired?: boolean;
  dueDate?: Date;
  estimatedDuration?: number;
  orderIndex?: number;
  isPublished?: boolean;
}

export type LessonWithRelations = Lesson & {
  class?: any;
  courseMaterials?: any[];
  assignments?: any[];
  weekProgress?: any[];
};

// Assignment DTOs
export interface CreateAssignmentDTO {
  lessonId: string;
  title: string;
  instructions: string;
  type: AssignmentType;
  maxPoints: number;
  rubric?: any;
  dueDate?: Date;
  allowLateSubmission?: boolean;
  isPublished?: boolean;
}

export interface UpdateAssignmentDTO {
  title?: string;
  instructions?: string;
  type?: AssignmentType;
  maxPoints?: number;
  rubric?: any;
  dueDate?: Date;
  allowLateSubmission?: boolean;
  isPublished?: boolean;
}

// Submission DTOs
export interface CreateSubmissionDTO {
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrl?: string;
  metadata?: any;
  status?: SubmissionStatus;
}

export interface UpdateSubmissionDTO {
  content?: string;
  fileUrl?: string;
  metadata?: any;
  status?: SubmissionStatus;
}

// Grade DTOs
export interface CreateGradeDTO {
  submissionId: string;
  points: number;
  maxPoints: number;
  instructorComment?: string;
  feedback?: any;
  status?: GradeStatus;
}

export interface UpdateGradeDTO {
  points?: number;
  maxPoints?: number;
  instructorComment?: string;
  feedback?: any;
  status?: GradeStatus;
}

// Message DTOs
export interface CreateMessageDTO {
  senderId: string;
  receiverId?: string;
  classId?: string;
  content: string;
  type: MessageType;
  attachments?: any;
  parentId?: string;
}

export interface UpdateMessageDTO {
  content?: string;
  attachments?: any;
}

// Certificate DTOs
export interface CreateCertificateDTO {
  enrollmentId: string;
}
