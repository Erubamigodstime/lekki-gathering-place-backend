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

  // Proxy methods for easy access
  async get(key: string): Promise<string | null> {
    return this.client ? await this.client.get(key) : null;
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
    return this.client ? await this.client.setex(key, seconds, value) : null;
  }

  async del(...keys: string[]): Promise<number> {
    return this.client ? await this.client.del(...keys) : 0;
  }

  async exists(...keys: string[]): Promise<number> {
    return this.client ? await this.client.exists(...keys) : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client ? await this.client.keys(pattern) : [];
  }

  async info(section?: string): Promise<string> {
    return this.client ? await this.client.info(section) : '';
  }

  async flushdb(): Promise<'OK'> {
    return this.client ? await this.client.flushdb() : 'OK';
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client ? await this.client.expire(key, seconds) : 0;
  }

  async ttl(key: string): Promise<number> {
    return this.client ? await this.client.ttl(key) : -1;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.info('Redis client disconnected');
    }
  }
}

export const redisClient = new RedisClient();
