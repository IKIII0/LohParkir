import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type UserRole = 'public' | 'officer' | 'admin' | 'superadmin';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Verify JWT ───────────────────────────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token autentikasi diperlukan' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Sesi telah berakhir, silakan login kembali' });
    } else {
      res.status(401).json({ success: false, message: 'Token tidak valid' });
    }
  }
}

// ─── Role-Based Access Control ────────────────────────────────────────────────
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengakses fitur ini',
      });
      return;
    }
    next();
  };
}

// ─── Admin or Superadmin ──────────────────────────────────────────────────────
export const authorizeAdmin = authorize('admin', 'superadmin');
export const authorizeSuperadmin = authorize('superadmin');
export const authorizeOfficer = authorize('officer', 'admin', 'superadmin');

// ─── Generate Tokens ──────────────────────────────────────────────────────────
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY as any });
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as any });
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
