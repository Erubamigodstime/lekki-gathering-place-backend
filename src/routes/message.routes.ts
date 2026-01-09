import { Router } from 'express';
import messageController from '../controllers/message.controller';
import { authMiddleware, validateRequest } from '../middleware/zod-validation.middleware';
import {
  sendDirectMessageSchema,
  sendClassMessageSchema,
  replyToMessageSchema,
  getMessageByIdSchema,
  getConversationSchema,
  getClassMessagesSchema,
  markMessageReadSchema,
} from '../validators/canvas.validator';

const router = Router();

router.use(authMiddleware);

// Get conversations list (WhatsApp-like inbox)
router.get('/conversations', messageController.getConversations);

// Search users to message
router.get('/search/users', messageController.searchUsers);

// Get conversation thread with specific user
router.get('/thread/:userId', messageController.getConversationThread);

// Get unread message count
router.get('/unread/count', messageController.getUnreadCount);

// Send a direct message
router.post('/direct', validateRequest(sendDirectMessageSchema), messageController.sendDirect);

// Send a message to a class
router.post('/class', validateRequest(sendClassMessageSchema), messageController.sendToClass);

// Reply to a message
router.post('/reply/:parentId', validateRequest(replyToMessageSchema), messageController.reply);

// Get message by ID
router.get('/:id', validateRequest(getMessageByIdSchema), messageController.getById);

// Get inbox messages
router.get('/inbox/all', messageController.getInbox);

// Get sent messages
router.get('/sent/all', messageController.getSent);

// Get class messages
router.get('/class/:classId', validateRequest(getClassMessagesSchema), messageController.getClassMessages);

// Get conversation with another user
router.get('/conversation/:userId', validateRequest(getConversationSchema), messageController.getConversation);

// Mark message as read
router.post('/:id/read', validateRequest(markMessageReadSchema), messageController.markRead);

// Mark all messages as read
router.post('/read/all', messageController.markAllRead);

// Delete a message (soft delete)
router.delete('/:id', messageController.delete);

export default router;
