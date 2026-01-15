import { redisClient } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Enhanced Cache Service for Redis
 * Provides high-performance caching with TTL management and pattern-based invalidation
 */
class EnhancedCacheService {
  private readonly DEFAULT_TTL = 300; // 5 minutes
  
  /**
   * Cache key patterns for consistent naming
   */
  readonly keys = {
    // User-related
    user: (userId: string) => `user:${userId}`,
    userProfile: (userId: string) => `user:${userId}:profile`,
    
    // Class-related
    class: (classId: string) => `class:${classId}`,
    classList: () => 'class:list',
    classLessons: (classId: string) => `class:${classId}:lessons`,
    classEnrollments: (classId: string) => `class:${classId}:enrollments`,
    classEnrollmentCount: (classId: string) => `class:${classId}:enrollment:count`,
    
    // Lesson-related
    lesson: (lessonId: string) => `lesson:${lessonId}`,
    lessonsByClass: (classId: string) => `lessons:class:${classId}`,
    
    // Message-related
    conversations: (userId: string) => `conversations:${userId}`,
    thread: (userId1: string, userId2: string) => {
      const [first, second] = [userId1, userId2].sort();
      return `thread:${first}:${second}`;
    },
    unreadCount: (userId: string) => `unread:${userId}`,
    classMessages: (classId: string) => `messages:class:${classId}`,
    
    // Grade-related
    studentGrades: (studentId: string, classId?: string) => 
      classId ? `grades:student:${studentId}:class:${classId}` : `grades:student:${studentId}`,
    classGrades: (classId: string) => `grades:class:${classId}`,
    
    // Ward-related
    wardList: () => 'ward:list',
    ward: (wardId: string) => `ward:${wardId}`,
    
    // Enrollment-related
    studentEnrollments: (studentId: string) => `enrollments:student:${studentId}`,
    enrollment: (enrollmentId: string) => `enrollment:${enrollmentId}`,
  };

  /**
   * TTL configurations for different data types (in seconds)
   */
  readonly ttl = {
    veryShort: 60,        // 1 minute - frequently changing data
    short: 300,           // 5 minutes - user profiles, dynamic data
    medium: 600,          // 10 minutes - lessons, class info
    long: 900,            // 15 minutes - class details
    veryLong: 3600,       // 1 hour - ward list, static data
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const ttl = ttlSeconds || this.DEFAULT_TTL;
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete one or more keys from cache
   */
  async del(keys: string | string[]): Promise<number> {
    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      if (keyArray.length === 0) return 0;
      return await redisClient.del(...keyArray);
    } catch (error) {
      logger.error('Cache delete error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Not in cache, fetch fresh data
      const fresh = await fetchFn();
      
      // Cache the result
      await this.set(key, fresh, ttlSeconds);
      
      return fresh;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // If cache fails, still return the fresh data
      return await fetchFn();
    }
  }

  /**
   * Invalidate cache by pattern (e.g., "class:*" to delete all class caches)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.del(keys);
    } catch (error) {
      logger.error(`Cache pattern invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate all caches related to a class
   */
  async invalidateClass(classId: string): Promise<void> {
    await Promise.all([
      this.del([
        this.keys.class(classId),
        this.keys.classList(),
        this.keys.classLessons(classId),
        this.keys.classEnrollments(classId),
        this.keys.classEnrollmentCount(classId),
        this.keys.lessonsByClass(classId),
        this.keys.classMessages(classId),
        this.keys.classGrades(classId),
      ]),
    ]);
  }

  /**
   * Invalidate all caches related to a user
   */
  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.del([
        this.keys.user(userId),
        this.keys.userProfile(userId),
        this.keys.conversations(userId),
        this.keys.unreadCount(userId),
      ]),
      this.invalidatePattern(`thread:${userId}:*`),
      this.invalidatePattern(`thread:*:${userId}`),
    ]);
  }

  /**
   * Invalidate all caches related to a student
   */
  async invalidateStudent(studentId: string): Promise<void> {
    await Promise.all([
      this.del([
        this.keys.studentGrades(studentId),
        this.keys.studentEnrollments(studentId),
      ]),
      this.invalidatePattern(`grades:student:${studentId}:*`),
    ]);
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(): Promise<void> {
    logger.info('Cache warm-up started');
    // Implementation would fetch and cache commonly accessed data
    // This can be called on server startup
    logger.info('Cache warm-up completed');
  }

  /**
   * Get cache statistics (if supported by Redis)
   */
  async getStats(): Promise<any> {
    try {
      const info = await redisClient.info('stats');
      return info;
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Flush all cache (use with caution)
   */
  async flush(): Promise<void> {
    try {
      await redisClient.flushdb();
      logger.warn('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  /**
   * Set expiration time for an existing key
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await redisClient.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttlRemaining(key: string): Promise<number> {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL check error for key ${key}:`, error);
      return -1;
    }
  }
}

export const cacheService = new EnhancedCacheService();
export default cacheService;
