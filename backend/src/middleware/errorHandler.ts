import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`[ERROR] ${statusCode}: ${err.message}`, isDev ? err.stack : '');

  res.status(statusCode).json({
    success: false,
    message: err.isOperational
      ? err.message
      : 'Terjadi kesalahan sistem. Tim kami sedang menangani masalah ini.',
    ...(isDev && { stack: err.stack }),
  });
}

export function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError;
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
