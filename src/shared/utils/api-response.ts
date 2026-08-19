import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: Pagination,
) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    ...(pagination && { pagination }),
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
  });
}
