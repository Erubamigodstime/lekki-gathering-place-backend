import NodeCache from 'node-cache';
import { logger } from './logger';

// In-memory cache with 30-second TTL
// For production with multiple servers, use Redis (Upstash free tier)
class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 30, // 30 seconds default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Better performance, be careful with mutations
    });

    // Log cache stats periodically
    setInterval(() => {
      const stats = this.cache.getStats();
      logger.info(`Cache stats - Keys: ${stats.keys}, Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${(stats.hits / (stats.hits + stats.misses) * 100 || 0).toFixed(2)}%`);
    }, 300000); // Every 5 minutes
  }

  // Get from cache
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  // Set to cache with optional TTL
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  // Delete from cache
  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  // Check if key exists
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Get or set (lazy loading)
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  // Clear all cache
  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  // Get cache statistics
  getStats() {
    return this.cache.getStats();
  }

  // Cache key patterns for consistency
  keys = {
    conversations: (userId: string) => `conversations:${userId}`,
    thread: (userId: string, partnerId: string) => `thread:${userId}:${partnerId}`,
    unreadCount: (userId: string) => `unread:${userId}`,
    user: (userId: string) => `user:${userId}`,
    classMembers: (classId: string) => `class:${classId}:members`,
  };
}

export default new CacheService();
