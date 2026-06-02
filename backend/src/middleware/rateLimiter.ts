import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// ─── Global Rate Limiter: 100 req/menit per IP ────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
  },
  keyGenerator: (req) => req.ip || 'unknown',
});

// ─── Strict Limiter: 5 laporan/hari per user ─────────────────────────────────
export const reportLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 jam
  max: 5,
  message: {
    success: false,
    message: 'Anda telah mencapai batas maksimal 5 laporan per hari.',
  },
  keyGenerator: (req) => req.user?.userId || req.ip || 'unknown',
});

// ─── Auth Limiter: cegah brute force login ────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  },
});
