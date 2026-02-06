import { z } from 'zod';
import { AssignmentType, SubmissionStatus, GradeStatus } from '@prisma/client';

// ============================================================================
// LESSON VALIDATORS
// ============================================================================

export const createLessonSchema = z.object({
  body: z.object({
    classId: z.string().uuid('Invalid class ID'),
    weekNumber: z.number().int().min(1, 'Week number must be at least 1'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(5000, 'Description too long').optional(),
    videoUrl: z.string().url('Invalid video URL').optional(),
    completionRequired: z.boolean().optional(),
    dueDate: z.string().datetime().optional(),
    estimatedDuration: z.number().int().min(1).max(600).optional(),
    orderIndex: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const updateLessonSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lesson ID'),
  }),
  body: z.object({
    weekNumber: z.number().int().min(1).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    videoUrl: z.string().url().optional(),
    completionRequired: z.boolean().optional(),
    dueDate: z.string().datetime().optional(),
    estimatedDuration: z.number().int().min(1).max(600).optional(),
    orderIndex: z.number().int().min(0).optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const getLessonByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid lesson ID'),
  }),
});

export const getLessonsByClassSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Invalid class ID'),
  }),
  query: z.object({
    includeUnpublished: z.string().optional().transform(val => val === 'true'),
  }),
});

export const getLessonByWeekSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Invalid class ID'),
    weekNumber: z.string().transform(val => parseInt(val)),
  }),
});

export const markLessonCompleteSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid('Invalid lesson ID'),
  }),
  body: z.object({
    studentId: z.string().uuid('Invalid student ID'),
    enrollmentId: z.string().uuid('Invalid enrollment ID'),
  }),
});

// ============================================================================
// ASSIGNMENT VALIDATORS
// ============================================================================

export const createAssignmentSchema = z.object({
  body: z.object({
    lessonId: z.string().uuid('Invalid lesson ID'),
    title: z.string().min(1, 'Title is required').max(200),
    instructions: z.string().min(1, 'Instructions are required').max(10000),
    type: z.nativeEnum(AssignmentType, { errorMap: () => ({ message: 'Invalid assignment type' }) }),
    maxPoints: z.number().min(0, 'Max points must be positive'),
    rubric: z.any().optional(),
    dueDate: z.string().datetime().optional(),
    allowLateSubmission: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    instructions: z.string().min(1).max(10000).optional(),
    type: z.nativeEnum(AssignmentType).optional(),
    maxPoints: z.number().min(0).optional(),
    rubric: z.any().optional(),
    dueDate: z.string().datetime().optional(),
    allowLateSubmission: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const getAssignmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
  query: z.object({
    includeRelations: z.string().optional().transform(val => val === 'true'),
  }),
});

export const getAssignmentsByLessonSchema = z.object({
  params: z.object({
    lessonId: z.string().uuid('Invalid lesson ID'),
  }),
  query: z.object({
    includeUnpublished: z.string().optional().transform(val => val === 'true'),
  }),
});

export const getAssignmentsForStudentSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Invalid class ID'),
    studentId: z.string().uuid('Invalid student ID'),
  }),
});

// ============================================================================
// SUBMISSION VALIDATORS
// ============================================================================

export const createSubmissionSchema = z.object({
  body: z.object({
    assignmentId: z.string().uuid('Invalid assignment ID'),
    studentId: z.string().uuid('Invalid student ID').optional(), // Optional since it comes from auth
    content: z.string().max(50000).optional(),
    fileUrl: z.string().optional(), // Remove URL validation to allow cloudinary URLs
    metadata: z.any().optional(),
    status: z.nativeEnum(SubmissionStatus).optional(),
  }).refine(data => data.content || data.fileUrl, {
    message: 'Either content or fileUrl must be provided',
  }),
});

export const updateSubmissionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
  body: z.object({
    content: z.string().max(50000).optional(),
    fileUrl: z.string().url().optional(),
    metadata: z.any().optional(),
    status: z.nativeEnum(SubmissionStatus).optional(),
  }),
});

export const getSubmissionByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

export const getSubmissionsByAssignmentSchema = z.object({
  params: z.object({
    assignmentId: z.string().uuid('Invalid assignment ID'),
  }),
  query: z.object({
    latestOnly: z.string().optional().transform(val => val === 'true'),
  }),
});

export const getSubmissionsByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().uuid('Invalid student ID'),
  }),
  query: z.object({
    classId: z.string().uuid().optional(),
  }),
});

export const submitSubmissionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

export const approveSubmissionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

export const rejectSubmissionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

// ============================================================================
// GRADE VALIDATORS
// ============================================================================

export const createGradeSchema = z.object({
  body: z.object({
    submissionId: z.string().uuid('Invalid submission ID'),
    points: z.number().min(0, 'Points cannot be negative'),
    maxPoints: z.number().min(0, 'Max points cannot be negative'),
    instructorComment: z.string().max(5000).optional(),
    feedback: z.any().optional(),
    status: z.nativeEnum(GradeStatus).optional(),
  }).refine(data => data.points <= data.maxPoints, {
    message: 'Points cannot exceed max points',
  }),
});

export const updateGradeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid grade ID'),
  }),
  body: z.object({
    points: z.number().min(0).optional(),
    maxPoints: z.number().min(0).optional(),
    instructorComment: z.string().max(5000).optional(),
    feedback: z.any().optional(),
    status: z.nativeEnum(GradeStatus).optional(),
  }),
});

export const getGradeByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid grade ID'),
  }),
});

export const getGradesByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().uuid('Invalid student ID'),
  }),
  query: z.object({
    classId: z.string().uuid().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

export const publishGradeSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid grade ID'),
  }),
});

export const getStudentClassGradeSchema = z.object({
  params: z.object({
    studentId: z.string().uuid('Invalid student ID'),
    classId: z.string().uuid('Invalid class ID'),
  }),
});

// ============================================================================
// MESSAGE VALIDATORS
// ============================================================================

export const sendDirectMessageSchema = z.object({
  body: z.object({
    receiverId: z.string().uuid('Invalid receiver ID'),
    content: z.string().min(1, 'Content is required').max(10000),
    attachments: z.any().optional(),
  }),
});

export const sendClassMessageSchema = z.object({
  body: z.object({
    classId: z.string().uuid('Invalid class ID'),
    content: z.string().min(1, 'Content is required').max(10000),
    attachments: z.any().optional(),
  }),
});

export const replyToMessageSchema = z.object({
  params: z.object({
    parentId: z.string().uuid('Invalid message ID'),
  }),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(10000),
    attachments: z.any().optional(),
  }),
});

export const getMessageByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid message ID'),
  }),
});

export const getConversationSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

export const getClassMessagesSchema = z.object({
  params: z.object({
    classId: z.string().uuid('Invalid class ID'),
  }),
  query: z.object({
    unread: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

export const markMessageReadSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid message ID'),
  }),
});

// ============================================================================
// CERTIFICATE VALIDATORS
// ============================================================================

export const generateCertificateSchema = z.object({
  body: z.object({
    enrollmentId: z.string().uuid('Invalid enrollment ID'),
  }),
});

export const getCertificateByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid certificate ID'),
  }),
});

export const getCertificateByCodeSchema = z.object({
  params: z.object({
    code: z.string().min(10, 'Invalid certificate code'),
  }),
});

export const verifyCertificateSchema = z.object({
  params: z.object({
    code: z.string().min(10, 'Invalid certificate code'),
  }),
});

export const revokeCertificateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid certificate ID'),
  }),
  body: z.object({
    reason: z.string().min(10, 'Revocation reason is required').max(500),
  }),
});

export const getCertificatesByStudentSchema = z.object({
  params: z.object({
    studentId: z.string().uuid('Invalid student ID'),
  }),
});
