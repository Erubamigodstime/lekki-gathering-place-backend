/**
 * Push Notification Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getVapidKey,
  subscribe,
  unsubscribe,
  getSubscriptionStatus,
  sendTestNotification,
} from '../controllers/push.controller';

const router = Router();

// Public: Get VAPID public key
router.get('/vapid-key', getVapidKey);

// Protected routes (require authentication)
router.use(authenticate);

// Subscribe to push notifications
router.post('/subscribe', subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', unsubscribe);

// Get subscription status
router.get('/status', getSubscriptionStatus);

// Send test notification (for debugging)
router.post('/test', sendTestNotification);

export default router;
