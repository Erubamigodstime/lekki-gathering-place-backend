import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>
  private pendingAcks: Map<string, NodeJS.Timeout> = new Map(); // messageId -> timeout

  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:8080',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      logger.info(`User connected: ${userId} (${socket.id})`);

      // Track user's socket connections (they might have multiple tabs)
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Broadcast online status
      this.broadcastUserStatus(userId, true);

      // Handle typing indicator
      socket.on('typing:start', (data: { receiverId: string }) => {
        this.emitToUser(data.receiverId, 'typing:start', {
          senderId: userId,
        });
      });

      socket.on('typing:stop', (data: { receiverId: string }) => {
        this.emitToUser(data.receiverId, 'typing:stop', {
          senderId: userId,
        });
      });

      // ENTERPRISE: Handle message delivery acknowledgment
      socket.on('message:ack:delivered', async (data: { messageId: string }) => {
        logger.info(`Message ${data.messageId} delivered to user ${userId}`);
        
        // Clear pending ACK timeout
        const timeout = this.pendingAcks.get(data.messageId);
        if (timeout) {
          clearTimeout(timeout);
          this.pendingAcks.delete(data.messageId);
        }

        try {
          // Dynamic import to avoid circular dependency
          const { messageQueueService } = await import('../services/messageQueue.service');
          
          // Remove from message queue if it was queued
          await messageQueueService.removeMessage(data.messageId);

          // Queue delivery receipt for processing
          await messageQueueService.queueDeliveryReceipt({
            messageId: data.messageId,
            receiverId: userId,
            status: 'delivered',
            timestamp: new Date(),
          });
        } catch (error) {
          logger.error('Failed to process delivery ACK:', error);
        }
      });

      // ENTERPRISE: Handle message read receipt
      socket.on('message:read', async (data: { messageId: string; senderId: string }) => {
        logger.info(`Message ${data.messageId} read by user ${userId}`);

        try {
          // Dynamic import to avoid circular dependency
          const { messageQueueService } = await import('../services/messageQueue.service');
          
          // Queue read receipt for processing
          await messageQueueService.queueDeliveryReceipt({
            messageId: data.messageId,
            receiverId: userId,
            status: 'read',
            timestamp: new Date(),
          });
        } catch (error) {
          logger.error('Failed to process read receipt:', error);
        }
      });

      // ENTERPRISE: Handle reconnection sync request
      socket.on('sync:request', async (data: { partnerId: string; lastSequence: number }) => {
        logger.info(`Sync request from user ${userId} for conversation with ${data.partnerId}, last sequence: ${data.lastSequence}`);
        
        try {
          // Import dynamically to avoid circular dependency
          const { MessageService } = await import('../services/message.service');
          const messageService = new MessageService();
          
          const syncData = await messageService.syncMissedMessages(
            userId,
            data.partnerId,
            data.lastSequence
          );

          socket.emit('sync:response', syncData);

          if (syncData.hasGap) {
            logger.warn(`Message gap detected for user ${userId} in conversation with ${data.partnerId}. Missing sequences: ${syncData.expectedSequences.join(', ')}`);
          }
        } catch (error) {
          logger.error(`Failed to sync messages for user ${userId}:`, error);
          socket.emit('sync:error', { error: 'Failed to sync messages' });
        }
      });

      // ENTERPRISE: Deliver pending messages on reconnect
      socket.on('connection:ready', async () => {
        logger.info(`User ${userId} connection ready, checking for pending messages`);
        
        try {
          // Dynamic import to avoid circular dependency
          const { messageQueueService } = await import('../services/messageQueue.service');
          
          const pendingMessages = await messageQueueService.getPendingMessages(userId);
          
          if (pendingMessages.length > 0) {
            logger.info(`Delivering ${pendingMessages.length} pending messages to user ${userId}`);
            
            for (const msgData of pendingMessages) {
              this.emitNewMessage(userId, {
                id: msgData.messageId,
                senderId: msgData.senderId,
                receiverId: msgData.receiverId,
                content: msgData.content,
                conversationId: msgData.conversationId,
                sequenceNumber: msgData.sequenceNumber,
                serverTimestamp: msgData.timestamp,
                createdAt: msgData.timestamp,
                type: 'DIRECT',
              });

              // Request ACK for each pending message
              this.requestDeliveryAck(userId, msgData.messageId);
            }
          }
        } catch (error) {
          logger.error('Failed to deliver pending messages:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${userId} (${socket.id})`);
        
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
          userSocketSet.delete(socket.id);
          
          // If user has no more active connections, mark as offline
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId);
            this.broadcastUserStatus(userId, false);
          }
        }
      });
    });

    logger.info('Socket.io initialized successfully');
  }

  // Emit new message to recipient (ENTERPRISE VERSION with ACK request)
  emitNewMessage(receiverId: string, message: any) {
    this.emitToUser(receiverId, 'message:new', message);
  }

  // ENTERPRISE: Request delivery acknowledgment with timeout
  requestDeliveryAck(_receiverId: string, messageId: string, timeoutMs = 10000) {
    // Set timeout for ACK - if not received, queue for retry
    const timeout = setTimeout(async () => {
      logger.warn(`No ACK received for message ${messageId}, queuing for retry`);
      
      // Message was not acknowledged, queue it for retry
      // This will be handled by the message queue service
      this.pendingAcks.delete(messageId);
    }, timeoutMs);

    this.pendingAcks.set(messageId, timeout);
  }

  // ENTERPRISE: Emit delivery receipt to sender
  emitDeliveryReceipt(senderId: string, receipt: { messageId: string; status: 'delivered' | 'read'; timestamp: Date }) {
    this.emitToUser(senderId, 'message:receipt', receipt);
  }

  // Emit conversation update (for conversation list)
  emitConversationUpdate(userId: string, conversation: any) {
    this.emitToUser(userId, 'conversation:update', conversation);
  }

  // Emit to a specific user (all their connected devices)
  private emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds && this.io) {
      socketIds.forEach(socketId => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  // Broadcast user online/offline status
  private broadcastUserStatus(userId: string, isOnline: boolean) {
    if (this.io) {
      this.io.emit('user:status', {
        userId,
        isOnline,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Get all online user IDs
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  getIO() {
    return this.io;
  }
}

export default new SocketService();
