import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

class RedisClient {
  private client: Redis | null = null;

  connect() {
    try {
      // Check if using Upstash (cloud Redis) - requires TLS
      const isUpstash = config.redis.host.includes('upstash.io');
      
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        tls: isUpstash ? {} : undefined, // Enable TLS for Upstash
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis Client Error:', err);
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      return null;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis client disconnected');
    }
  }
}

export const redisClient = new RedisClient();
