import app from './app';
import { config } from './config';
import { logger } from './config/logger';
import prisma from './config/database';
import { redisClient } from './config/redis';
import { KeepAliveUtil } from './utils/keep-alive.util';
import socketService from './config/socket';
import { createServer } from 'http';

const PORT = config.port;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Stop keep-alive service
    KeepAliveUtil.stop();

    // Disconnect from database
    await prisma.$disconnect();
    logger.info('Database connection closed');

    // Disconnect from Redis
    await redisClient.disconnect();
    logger.info('Redis connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Connect to Redis (optional)
    try {
      redisClient.connect();
    } catch (error) {
      logger.warn('Redis connection failed. Continuing without Redis...', error);
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    try {
      socketService.initialize(httpServer);
      logger.info('Socket.io initialized for real-time messaging');
    } catch (error) {
      logger.error('Failed to initialize Socket.io:', error);
      logger.warn('Continuing without Socket.io...');
    }

    // Start HTTP server
    const server = httpServer.listen(PORT, () => {
      logger.info(`
        ╔═══════════════════════════════════════════════════╗
        ║                                                   ║
        ║   Lekki Gathering Place API Server Started       ║
        ║                                                   ║
        ║   Environment: ${config.env.padEnd(34)}║
        ║   Port: ${PORT.toString().padEnd(42)}║
        ║   API Version: ${config.apiVersion.padEnd(36)}║
        ║   WebSocket: Enabled${' '.padEnd(30)}║
        ║                                                   ║
        ║   API: http://localhost:${PORT}/api/${config.apiVersion.padEnd(16)}║
        ║   Docs: http://localhost:${PORT}/api-docs${' '.repeat(15)}║
        ║   Socket: ws://localhost:${PORT}${' '.repeat(19)}║
        ║                                                   ║
        ╚═══════════════════════════════════════════════════╝
      `);

      // Start keep-alive service (only in production)
      KeepAliveUtil.start();
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          logger.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize server
startServer();
// Clean
