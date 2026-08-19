import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../shared/utils/api-error.js';
import { sendError } from '../shared/utils/api-response.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400);
  }

  // Mongoose duplicate key
  if ((err as any).code === 11000) {
    return sendError(res, 'A record with this value already exists', 409);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  console.error('Unhandled error:', err);
  return sendError(res, 'Internal server error', 500);
}
