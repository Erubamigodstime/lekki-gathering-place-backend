/**
 * Push Notification Controller
 * 
 * Handles push notification subscription management
 */

import { Request, Response, NextFunction } from 'express';
import pushNotificationService from '../services/push.service';
import { ResponseUtil } from '../utils/response.util';

interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Get VAPID public key for client-side subscription
 */
export const getVapidKey = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const vapidKey = pushNotificationService.getVapidPublicKey();
    
    if (!vapidKey) {
      ResponseUtil.error(res, 'Push notifications not configured', 503);
      return;
    }

    ResponseUtil.success(res, 'VAPID key retrieved', { vapidKey });
  } catch (error) {
    next(error);
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res);
      return;
    }

    const { subscription } = req.body;
    
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      ResponseUtil.badRequest(res, 'Invalid subscription data');
      return;
    }

    const userAgent = req.headers['user-agent'];

    await pushNotificationService.subscribe(userId, subscription, userAgent);

    ResponseUtil.success(res, 'Successfully subscribed to push notifications');
  } catch (error) {
    next(error);
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      ResponseUtil.badRequest(res, 'Endpoint is required');
      return;
    }

    await pushNotificationService.unsubscribe(endpoint);

    ResponseUtil.success(res, 'Successfully unsubscribed from push notifications');
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's push subscription status
 */
export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res);
      return;
    }

    const subscriptions = await pushNotificationService.getUserSubscriptions(userId);

    ResponseUtil.success(res, 'Subscription status retrieved', {
      isSubscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a test notification (for debugging)
 */
export const sendTestNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      ResponseUtil.unauthorized(res);
      return;
    }

    const count = await pushNotificationService.sendToUser(userId, {
      title: 'Test Notification',
      body: 'Push notifications are working correctly! 🎉',
      tag: 'test-notification',
      data: {
        type: 'TEST',
        timestamp: new Date().toISOString(),
      },
    });

    if (count > 0) {
      ResponseUtil.success(res, 'Test notification sent', { notificationsSent: count });
    } else {
      ResponseUtil.notFound(res, 'No active subscriptions found');
    }
  } catch (error) {
    next(error);
  }
};
