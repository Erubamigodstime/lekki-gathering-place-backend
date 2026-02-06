import { Request, Response } from 'express';
import messageService from '../services/message.service';
import { ResponseUtil } from '../utils/response.util';

export class MessageController {
  async sendDirect(req: Request, res: Response) {
    try {
      const senderId = req.user!.id;
      const { receiverId, content, attachments } = req.body;
      const message = await messageService.sendDirect(senderId, receiverId, content, attachments);
      return ResponseUtil.success(res, 'Message sent successfully', message, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async sendToClass(req: Request, res: Response) {
    try {
      const senderId = req.user!.id;
      const { classId, content, attachments } = req.body;
      const message = await messageService.sendToClass(senderId, classId, content, attachments);
      return ResponseUtil.success(res, 'Message sent to class successfully', message, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async reply(req: Request, res: Response) {
    try {
      const senderId = req.user!.id;
      const { parentId } = req.params;
      const { content, attachments } = req.body;
      const message = await messageService.reply(senderId, parentId, content, attachments);
      return ResponseUtil.success(res, 'Reply sent successfully', message, 201);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const message = await messageService.getById(id);
      if (!message) return ResponseUtil.error(res, 'Message not found', 404);
      return ResponseUtil.success(res, 'Success', message);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getInbox(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unreadOnly === 'true';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await messageService.getInbox(userId, unreadOnly, page, limit);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getSent(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await messageService.getSent(userId, page, limit);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getClassMessages(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { classId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const messages = await messageService.getClassMessages(classId, userId, page, limit);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getConversation(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { userId: otherUserId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await messageService.getConversation(userId, otherUserId, page, limit);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async markRead(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const message = await messageService.markRead(id, userId);
      return ResponseUtil.success(res, 'Message marked as read', message);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async markAllRead(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      await messageService.markAllRead(userId);
      return ResponseUtil.success(res, 'All messages marked as read', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const message = await messageService.delete(id, userId);
      return ResponseUtil.success(res, 'Message deleted successfully', message);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const count = await messageService.getUnreadCount(userId);
      return ResponseUtil.success(res, 'Success', { count });
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const conversations = await messageService.getConversations(userId);
      return ResponseUtil.success(res, 'Conversations fetched successfully', conversations);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async searchUsers(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return ResponseUtil.error(res, 'Search query is required', 400);
      }

      const users = await messageService.searchUsers(userId, q);
      return ResponseUtil.success(res, 'Users found', users);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getMessageableUsers(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { classId } = req.query;

      const users = await messageService.getMessageableUsers(
        userId,
        classId as string | undefined
      );
      return ResponseUtil.success(res, 'Messageable users retrieved successfully', users);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getConversationThread(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { userId: otherUserId } = req.params;
      const messages = await messageService.getConversationThread(userId, otherUserId);
      return ResponseUtil.success(res, 'Conversation thread fetched successfully', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ENTERPRISE: Mark entire conversation as read
  async markConversationRead(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      // Support both :partnerId and :userId params for backwards compatibility
      const partnerId = req.params.partnerId || req.params.userId;
      
      if (!partnerId) {
        return ResponseUtil.error(res, 'Partner ID is required', 400);
      }
      
      await messageService.markConversationRead(userId, partnerId);
      return ResponseUtil.success(res, 'Conversation marked as read', null);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  // ENTERPRISE: Get message queue statistics
  async getQueueStats(_req: Request, res: Response) {
    try {
      const { messageQueueService } = await import('../services/messageQueue.service');
      const stats = await messageQueueService.getQueueStats();
      return ResponseUtil.success(res, 'Queue statistics fetched successfully', stats);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 500);
    }
  }

  // ENTERPRISE: Sync missed messages on reconnection
  async syncMessages(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { partnerId, lastSequence } = req.body;
      
      if (!partnerId || lastSequence === undefined) {
        return ResponseUtil.error(res, 'partnerId and lastSequence are required', 400);
      }

      const syncData = await messageService.syncMissedMessages(userId, partnerId, lastSequence);
      return ResponseUtil.success(res, 'Messages synced successfully', syncData);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }
}

export default new MessageController();
