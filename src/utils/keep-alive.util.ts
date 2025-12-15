import { config } from '@/config';
import { logger } from '@/config/logger';

/**
 * Keep-alive utility to prevent server from sleeping
 * Pings the server every 14 minutes to keep it active
 */
export class KeepAliveUtil {
  private static interval: NodeJS.Timeout | null = null;
  private static readonly PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

  /**
   * Start the keep-alive service
   * Only runs in production environment
   */
  static start(): void {
    // Only enable in production
    if (config.env !== 'production') {
      logger.info('Keep-alive service disabled in development');
      return;
    }

    // Only enable if URL is configured
    if (!config.urls.backend || config.urls.backend === 'http://localhost:5000') {
      logger.warn('Keep-alive service disabled: Backend URL not configured');
      return;
    }

    if (this.interval) {
      logger.warn('Keep-alive service already running');
      return;
    }

    this.interval = setInterval(() => {
      this.ping();
    }, this.PING_INTERVAL);

    logger.info(`Keep-alive service started (pinging every ${this.PING_INTERVAL / 60000} minutes)`);
  }

  /**
   * Stop the keep-alive service
   */
  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Keep-alive service stopped');
    }
  }

  /**
   * Perform a single ping to the server
   */
  static async ping(): Promise<void> {
    try {
      const url = `${config.urls.backend}/api/${config.apiVersion}/keep-alive`;
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Keep-Alive-Service',
        },
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        logger.info(`Keep-alive ping successful (${duration}ms)`);
      } else {
        logger.warn(`Keep-alive ping returned status ${response.status}`);
      }
    } catch (error) {
      logger.error('Keep-alive ping failed:', error);
    }
  }
}
