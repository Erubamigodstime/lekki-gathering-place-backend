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
      const messages = await messageService.getInbox(userId, unreadOnly);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getSent(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const messages = await messageService.getSent(userId);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getClassMessages(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { classId } = req.params;
      const messages = await messageService.getClassMessages(classId, userId);
      return ResponseUtil.success(res, 'Success', messages);
    } catch (error: any) {
      return ResponseUtil.error(res, error.message, 400);
    }
  }

  async getConversation(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { userId: otherUserId } = req.params;
      const messages = await messageService.getConversation(userId, otherUserId);
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
}

export default new MessageController();
