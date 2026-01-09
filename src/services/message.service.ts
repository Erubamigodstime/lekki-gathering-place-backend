import { PrismaClient, Message, MessageType } from '@prisma/client';

const prisma = new PrismaClient();

export class MessageService {
  /**
   * Send a direct message to another user
   */
  async sendDirect(
    senderId: string,
    receiverId: string,
    content: string,
    attachments?: any
  ): Promise<Message> {
    if (senderId === receiverId) {
      throw new Error('Cannot send message to yourself');
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new Error('Receiver not found');
    }

    return await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        type: MessageType.DIRECT,
        attachments,
      },
    });
  }

  /**
   * Send a message to a class (visible to all enrolled students and instructor)
   */
  async sendToClass(
    senderId: string,
    classId: string,
    content: string,
    attachments?: any
  ): Promise<Message> {
    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classExists) {
      throw new Error('Class not found');
    }

    // Verify sender is enrolled or is the instructor
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId,
        studentId: senderId,
        status: 'APPROVED',
      },
    });

    const isInstructor = classExists.instructorId === senderId;

    if (!enrollment && !isInstructor) {
      throw new Error('You must be enrolled in this class to send messages');
    }

    return await prisma.message.create({
      data: {
        senderId,
        classId,
        content,
        type: MessageType.CLASS,
        attachments,
      },
    });
  }

  /**
   * Send a broadcast message (admin/instructor to multiple users)
   */
  async sendBroadcast(
    senderId: string,
    content: string,
    classId?: string,
    attachments?: any
  ): Promise<Message> {
    return await prisma.message.create({
      data: {
        senderId,
        classId,
        content,
        type: MessageType.BROADCAST,
        attachments,
      },
    });
  }

  /**
   * Reply to a message (creates threaded conversation)
   */
  async reply(
    senderId: string,
    parentId: string,
    content: string,
    attachments?: any
  ): Promise<Message> {
    // Verify parent message exists
    const parentMessage = await prisma.message.findUnique({
      where: { id: parentId },
    });

    if (!parentMessage) {
      throw new Error('Parent message not found');
    }

    if (parentMessage.deletedAt) {
      throw new Error('Cannot reply to a deleted message');
    }

    return await prisma.message.create({
      data: {
        senderId,
        receiverId: parentMessage.senderId !== senderId ? parentMessage.senderId : parentMessage.receiverId,
        classId: parentMessage.classId,
        content,
        type: parentMessage.type,
        parentId,
        attachments,
      },
    });
  }

  /**
   * Get message by ID
   */
  async getById(id: string) {
    return await prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        parent: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get inbox messages for a user
   */
  async getInbox(userId: string, unreadOnly = false) {
    const where: any = {
      receiverId: userId,
      deletedAt: null,
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    return await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get sent messages for a user
   */
  async getSent(userId: string) {
    return await prisma.message.findMany({
      where: {
        senderId: userId,
        deletedAt: null,
      },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        class: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get class messages
   */
  async getClassMessages(classId: string, userId: string) {
    // Verify user has access to this class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId,
        studentId: userId,
        status: 'APPROVED',
      },
    });

    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    const isInstructor = classData?.instructorId === userId;

    if (!enrollment && !isInstructor) {
      throw new Error('You do not have access to this class');
    }

    return await prisma.message.findMany({
      where: {
        classId,
        deletedAt: null,
        parentId: null, // Only top-level messages
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get conversation between two users
   */
  async getConversation(userId1: string, userId2: string) {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
        deletedAt: null,
        parentId: null, // Only top-level messages
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
        replies: {
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Mark message as read
   */
  async markRead(id: string, userId: string): Promise<Message> {
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new Error('You can only mark your own messages as read');
    }

    return await prisma.message.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all messages as read for a user
   */
  async markAllRead(userId: string) {
    return await prisma.message.updateMany({
      where: {
        receiverId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a message (only sender can delete)
   */
  async delete(id: string, userId: string): Promise<Message> {
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('You can only delete your own messages');
    }

    return await prisma.message.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.message.count({
      where: {
        receiverId: userId,
        readAt: null,
        deletedAt: null,
      },
    });
  }

  /**
   * Get conversations list (WhatsApp-like inbox)
   * Returns unique conversations with last message, unread count, and participant info
   */
  async getConversations(userId: string) {
    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        type: MessageType.DIRECT,
        deletedAt: null,
        parentId: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!partnerId) continue;

      if (!conversationsMap.has(partnerId)) {
        const partner = message.senderId === userId ? message.receiver : message.sender;
        
        // Get unread count for this conversation
        const unreadCount = await prisma.message.count({
          where: {
            senderId: partnerId,
            receiverId: userId,
            readAt: null,
            deletedAt: null,
          },
        });

        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            isFromMe: message.senderId === userId,
            readAt: message.readAt,
          },
          unreadCount,
        });
      }
    }

    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }

  /**
   * Search users to message
   * For instructors: returns students from their classes
   * For students: returns instructors and students from their enrolled classes
   */
  async searchUsers(userId: string, query: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        instructorProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let searchResults: any[] = [];

    // If instructor, search their students
    if (user.instructorProfile) {
      const instructorClasses = await prisma.class.findMany({
        where: {
          instructorId: user.instructorProfile.id,
        },
        include: {
          enrollments: {
            where: {
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
                      profilePicture: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const studentsSet = new Set();
      for (const classItem of instructorClasses) {
        for (const enrollment of classItem.enrollments) {
          if (!studentsSet.has(enrollment.student.userId)) {
            studentsSet.add(enrollment.student.userId);
            const studentUser = enrollment.student.user;
            const fullName = `${studentUser.firstName} ${studentUser.lastName}`.toLowerCase();
            
            if (fullName.includes(query.toLowerCase()) || 
                studentUser.email.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({
                id: studentUser.id,
                firstName: studentUser.firstName,
                lastName: studentUser.lastName,
                email: studentUser.email,
                profilePicture: studentUser.profilePicture,
                role: studentUser.role,
                className: classItem.name,
              });
            }
          }
        }
      }
    }

    // If student, search instructors and classmates
    if (user.studentProfile) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: user.studentProfile.id,
          status: 'APPROVED',
        },
        include: {
          class: {
            include: {
              instructor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      profilePicture: true,
                      role: true,
                    },
                  },
                },
              },
              enrollments: {
                where: {
                  status: 'APPROVED',
                  studentId: {
                    not: user.studentProfile.id,
                  },
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
                          profilePicture: true,
                          role: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const usersSet = new Set();

      for (const enrollment of enrollments) {
        // Add instructor
        const instructorUser = enrollment.class.instructor.user;
        if (!usersSet.has(instructorUser.id)) {
          usersSet.add(instructorUser.id);
          const fullName = `${instructorUser.firstName} ${instructorUser.lastName}`.toLowerCase();
          
          if (fullName.includes(query.toLowerCase()) || 
              instructorUser.email.toLowerCase().includes(query.toLowerCase())) {
            searchResults.push({
              id: instructorUser.id,
              firstName: instructorUser.firstName,
              lastName: instructorUser.lastName,
              email: instructorUser.email,
              profilePicture: instructorUser.profilePicture,
              role: instructorUser.role,
              className: enrollment.class.name,
            });
          }
        }

        // Add classmates
        for (const classEnrollment of enrollment.class.enrollments) {
          const classmateUser = classEnrollment.student.user;
          if (!usersSet.has(classmateUser.id)) {
            usersSet.add(classmateUser.id);
            const fullName = `${classmateUser.firstName} ${classmateUser.lastName}`.toLowerCase();
            
            if (fullName.includes(query.toLowerCase()) || 
                classmateUser.email.toLowerCase().includes(query.toLowerCase())) {
              searchResults.push({
                id: classmateUser.id,
                firstName: classmateUser.firstName,
                lastName: classmateUser.lastName,
                email: classmateUser.email,
                profilePicture: classmateUser.profilePicture,
                role: classmateUser.role,
                className: enrollment.class.name,
              });
            }
          }
        }
      }
    }

    return searchResults;
  }

  /**
   * Get full conversation thread with a specific user (for WhatsApp-like view)
   */
  async getConversationThread(userId: string, otherUserId: string) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        type: MessageType.DIRECT,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Mark all messages from the other user as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return messages;
  }
}

export default new MessageService();
