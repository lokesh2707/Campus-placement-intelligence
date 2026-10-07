import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, PaginationMeta, ApiErrorDetail } from '@campus-os/shared-types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: PaginationMeta
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  meta: PaginationMeta,
  statusCode = 200,
  message?: string
): Response {
  return sendSuccess(res, items, statusCode, message, meta);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[]
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    statusCode,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}
