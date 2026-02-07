/**
 * Push Notification Service
 * 
 * Handles web push notifications for class reminders and announcements
 */

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configure VAPID keys for web push
// Generate keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:erubamigodstime43@gmail.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
}

export interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  /**
   * Get VAPID public key for client subscription
   */
  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: SubscriptionData,
    userAgent?: string
  ): Promise<void> {
    const { endpoint, keys } = subscription;

    // Upsert subscription (update if exists, create if not)
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent,
      },
    });

    console.log(`✅ Push subscription created/updated for user ${userId}`);
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(endpoint: string): Promise<void> {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    console.log(`✅ Push subscription removed for endpoint: ${endpoint.substring(0, 50)}...`);
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
    });
  }

  /**
   * Send a push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    const subscriptions = await this.getUserSubscriptions(userId);
    let successCount = 0;

    for (const sub of subscriptions) {
      const success = await this.sendNotification(sub, payload);
      if (success) successCount++;
    }

    return successCount;
  }

  /**
   * Send a push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<number> {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
    });

    let successCount = 0;
    for (const sub of subscriptions) {
      const success = await this.sendNotification(sub, payload);
      if (success) successCount++;
    }

    return successCount;
  }

  /**
   * Send a push notification to all enrolled students in a class
   */
  async sendToClassStudents(classId: string, payload: PushPayload): Promise<number> {
    // Get all enrolled students in the class
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        status: 'APPROVED',
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const userIds = enrollments.map((e) => e.student.userId);
    return this.sendToUsers(userIds, payload);
  }

  /**
   * Send a raw push notification to a subscription
   */
  private async sendNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    payload: PushPayload
  ): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('⚠️ VAPID keys not configured, skipping push notification');
      return false;
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          ...payload,
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/icon-72x72.png',
        })
      );
      return true;
    } catch (error: any) {
      console.error('Push notification error:', error.message);

      // Remove invalid subscriptions (410 Gone or 404 Not Found)
      if (error.statusCode === 410 || error.statusCode === 404) {
        await this.unsubscribe(subscription.endpoint);
        console.log('Removed expired subscription');
      }

      return false;
    }
  }

  /**
   * Send class reminder notification
   */
  async sendClassReminder(
    lessonId: string,
    studentId: string,
    reminderType: '1_DAY' | '1_HOUR'
  ): Promise<boolean> {
    // Check if reminder already sent
    const existingReminder = await prisma.scheduledReminder.findUnique({
      where: {
        lessonId_studentId_type: {
          lessonId,
          studentId,
          type: reminderType,
        },
      },
    });

    if (existingReminder) {
      console.log(`Reminder already sent for lesson ${lessonId}, student ${studentId}, type ${reminderType}`);
      return false;
    }

    // Get lesson and student details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        class: true,
      },
    });

    if (!lesson) {
      console.error(`Lesson ${lessonId} not found`);
      return false;
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      console.error(`Student ${studentId} not found`);
      return false;
    }

    // Create payload based on reminder type
    const timeText = reminderType === '1_DAY' ? 'tomorrow' : 'in 1 hour';
    const payload: PushPayload = {
      title: `Class Reminder: ${lesson.class.name}`,
      body: `"${lesson.title}" starts ${timeText}. Don't miss it!`,
      tag: `class-reminder-${lessonId}-${reminderType}`,
      requireInteraction: reminderType === '1_HOUR',
      data: {
        type: 'CLASS_REMINDER',
        classId: lesson.classId,
        lessonId: lesson.id,
        url: `/canvas/${lesson.classId}`,
      },
      actions: [
        { action: 'view', title: 'View Class' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    // Send notification
    const sent = await this.sendToUser(student.userId, payload);

    // Record the reminder
    if (sent > 0) {
      await prisma.scheduledReminder.create({
        data: {
          lessonId,
          studentId,
          type: reminderType,
        },
      });
    }

    return sent > 0;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
