/**
 * Enterprise Message Queue Service
 * 
 * Implements Bull queue with Redis for reliable offline message delivery
 * Features:
 * - Offline message queuing with retry logic
 * - Delivery receipts and acknowledgments
 * - Exponential backoff for failed deliveries
 * - Dead letter queue for permanently failed messages
 */

import Bull, { Job, Queue } from 'bull';
import Redis from 'ioredis';
import { logger } from '../config/logger';

interface MessageJobData {
  messageId: string;
  senderId: string;
  receiverId: string;
  content: string;
  conversationId: string;
  sequenceNumber: number;
  timestamp: Date;
  retryCount?: number;
}

interface DeliveryReceiptData {
  messageId: string;
  receiverId: string;
  status: 'delivered' | 'read';
  timestamp: Date;
}

class MessageQueueService {
  private messageQueue: Queue<MessageJobData> | null = null;
  private deliveryQueue: Queue<DeliveryReceiptData> | null = null;
  private deadLetterQueue: Queue<MessageJobData> | null = null;
  private redis: Redis | null = null;
  private initialized = false;

  constructor() {
    // Don't initialize immediately - wait for explicit init() call
  }

  /**
   * Initialize the message queue service
   * Called after server starts to avoid blocking startup
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Initialize Redis connection
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_HOST?.includes('upstash.io') ? {} : undefined,
        maxRetriesPerRequest: null, // Required for Bull
        enableReadyCheck: false,
      };

      this.redis = new Redis(redisConfig);

      // Initialize message queue for offline message delivery
      this.messageQueue = new Bull<MessageJobData>('message-delivery', {
        redis: redisConfig,
        defaultJobOptions: {
          attempts: 5, // Retry up to 5 times
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds, then 4, 8, 16, 32
          },
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 500, // Keep last 500 failed jobs for debugging
        },
      });

      // Initialize delivery receipt queue
      this.deliveryQueue = new Bull<DeliveryReceiptData>('delivery-receipts', {
        redis: redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 50,
          removeOnFail: 200,
        },
      });

      // Initialize dead letter queue for permanently failed messages
      this.deadLetterQueue = new Bull<MessageJobData>('message-dead-letter', {
        redis: redisConfig,
      });

      this.setupProcessors();
      this.setupEventListeners();

      this.initialized = true;
      logger.info('Message queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize message queue service:', error);
      logger.warn('Message queue will not be available - messages will be sent via WebSocket only');
    }
  }

  /**
   * Setup queue processors
   */
  private setupProcessors(): void {
    // Process message delivery jobs
    this.messageQueue.process(async (job: Job<MessageJobData>) => {
      const { messageId, receiverId, senderId, content, conversationId, sequenceNumber } = job.data;
      
      try {
        // Import socket service dynamically to avoid circular dependency
        const socketService = (await import('../config/socket')).default;
        
        // Check if receiver is online
        const isOnline = socketService.isUserOnline(receiverId);
        
        if (!isOnline) {
          // User still offline, retry later
          throw new Error(`User ${receiverId} is offline`);
        }

        // User is online, deliver the message via WebSocket
        socketService.emitNewMessage(receiverId, {
          id: messageId,
          senderId,
          receiverId,
          content,
          conversationId,
          sequenceNumber,
          createdAt: job.data.timestamp,
          serverTimestamp: job.data.timestamp,
          type: 'DIRECT',
        });

        // Request delivery acknowledgment
        socketService.requestDeliveryAck(receiverId, messageId);

        logger.info(`Message ${messageId} delivered to user ${receiverId}`);
        
        return { success: true, deliveredAt: new Date() };
      } catch (error) {
        const retryCount = (job.data.retryCount || 0) + 1;
        
        logger.warn(`Failed to deliver message ${messageId}, retry ${retryCount}/5:`, error);
        
        // Update retry count
        job.data.retryCount = retryCount;
        
        // If max retries exceeded, move to dead letter queue
        if (retryCount >= 5) {
          await this.deadLetterQueue.add(job.data);
          logger.error(`Message ${messageId} moved to dead letter queue after 5 failed attempts`);
        }
        
        throw error; // Re-throw to trigger Bull's retry mechanism
      }
    });

    // Process delivery receipts
    this.deliveryQueue.process(async (job: Job<DeliveryReceiptData>) => {
      const { messageId, status, timestamp } = job.data;
      
      try {
        // Import Prisma client dynamically
        const prisma = (await import('../config/database')).default;
        
        // Update message with delivery/read status
        if (status === 'delivered') {
          await prisma.message.update({
            where: { id: messageId },
            data: { deliveredAt: timestamp },
          });
        } else if (status === 'read') {
          await prisma.message.update({
            where: { id: messageId },
            data: { readAt: timestamp },
          });
        }

        // Notify sender via WebSocket
        const socketService = (await import('../config/socket')).default;
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { senderId: true },
        });

        if (message) {
          socketService.emitDeliveryReceipt(message.senderId, {
            messageId,
            status,
            timestamp,
          });
        }

        logger.info(`Delivery receipt processed for message ${messageId}: ${status}`);
        
        return { success: true };
      } catch (error) {
        logger.error(`Failed to process delivery receipt for message ${messageId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Setup event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    this.messageQueue.on('completed', (job, result) => {
      logger.info(`Message job ${job.id} completed:`, result);
    });

    this.messageQueue.on('failed', (job, err) => {
      logger.error(`Message job ${job?.id} failed:`, err);
    });

    this.messageQueue.on('stalled', (job) => {
      logger.warn(`Message job ${job.id} stalled`);
    });

    this.deliveryQueue.on('completed', (job) => {
      logger.info(`Delivery receipt job ${job.id} completed`);
    });

    this.deliveryQueue.on('failed', (job, err) => {
      logger.error(`Delivery receipt job ${job?.id} failed:`, err);
    });
  }

  /**
   * Queue a message for delivery (used when recipient is offline)
   */
  async queueMessage(messageData: MessageJobData): Promise<void> {
    if (!this.initialized || !this.messageQueue) {
      logger.warn('Message queue not initialized - skipping queue');
      return;
    }

    try {
      await this.messageQueue.add(messageData, {
        // First delivery attempt in 5 seconds
        delay: 5000,
        // Job ID to prevent duplicates
        jobId: messageData.messageId,
      });

      logger.info(`Message ${messageData.messageId} queued for delivery to user ${messageData.receiverId}`);
    } catch (error) {
      logger.error(`Failed to queue message ${messageData.messageId}:`, error);
      throw error;
    }
  }

  /**
   * Queue a delivery receipt for processing
   */
  async queueDeliveryReceipt(receiptData: DeliveryReceiptData): Promise<void> {
    if (!this.initialized || !this.deliveryQueue) {
      logger.warn('Delivery queue not initialized - skipping receipt');
      return;
    }

    try {
      await this.deliveryQueue.add(receiptData);
      logger.info(`Delivery receipt queued for message ${receiptData.messageId}: ${receiptData.status}`);
    } catch (error) {
      logger.error(`Failed to queue delivery receipt for message ${receiptData.messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending messages for a user (for reconnection sync)
   */
  async getPendingMessages(userId: string): Promise<MessageJobData[]> {
    if (!this.initialized || !this.messageQueue) {
      return [];
    }

    try {
      const jobs = await this.messageQueue.getJobs(['waiting', 'delayed', 'active']);
      
      // Filter jobs for this specific user
      const userJobs = jobs.filter(job => job.data.receiverId === userId);
      
      return userJobs.map(job => job.data);
    } catch (error) {
      logger.error(`Failed to get pending messages for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Remove a message from the queue (if successfully delivered through other means)
   */
  async removeMessage(messageId: string): Promise<void> {
    if (!this.initialized || !this.messageQueue) {
      return;
    }

    try {
      const job = await this.messageQueue.getJob(messageId);
      if (job) {
        await job.remove();
        logger.info(`Message ${messageId} removed from queue`);
      }
    } catch (error) {
      logger.error(`Failed to remove message ${messageId} from queue:`, error);
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats() {
    if (!this.initialized || !this.messageQueue || !this.deliveryQueue || !this.deadLetterQueue) {
      return {
        messageQueue: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        deliveryQueue: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        deadLetterQueue: { waiting: 0 }
      };
    }

    try {
      const [messageQueueCounts, deliveryQueueCounts, deadLetterCount] = await Promise.all([
        this.messageQueue.getJobCounts(),
        this.deliveryQueue.getJobCounts(),
        this.deadLetterQueue.count(),
      ]);

      return {
        messageQueue: messageQueueCounts,
        deliveryQueue: deliveryQueueCounts,
        deadLetterQueue: { waiting: deadLetterCount },
      };
    } catch (error) {
      logger.error('Failed to get queue statistics:', error);
      return null;
    }
  }

  /**
   * Cleanup - close all connections
   */
  async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const closePromises: Promise<any>[] = [];
    
    if (this.messageQueue) closePromises.push(this.messageQueue.close());
    if (this.deliveryQueue) closePromises.push(this.deliveryQueue.close());
    if (this.deadLetterQueue) closePromises.push(this.deadLetterQueue.close());
    if (this.redis) closePromises.push(this.redis.quit());

    await Promise.all(closePromises);
    this.initialized = false;
    logger.info('Message queue service closed');
  }
}

// Export singleton instance
export const messageQueueService = new MessageQueueService();
