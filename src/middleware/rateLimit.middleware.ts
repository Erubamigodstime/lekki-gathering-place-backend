import rateLimit from 'express-rate-limit';
import { config } from '@/config';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Higher limit for development
  message: { 
    success: false,
    message: 'Too many login attempts, please try again in 1 minute.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});
