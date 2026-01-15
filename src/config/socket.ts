import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from './logger';

interface SocketUser {
  userId: string;
  socketId: string;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

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

      // Handle message read receipt
      socket.on('message:read', (data: { messageId: string; senderId: string }) => {
        this.emitToUser(data.senderId, 'message:read', {
          messageId: data.messageId,
          readAt: new Date().toISOString(),
        });
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

  // Emit new message to recipient
  emitNewMessage(receiverId: string, message: any) {
    this.emitToUser(receiverId, 'message:new', message);
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
