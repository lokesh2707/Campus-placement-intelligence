import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, PaginationMeta, ApiErrorDetail } from '@campus-os/shared-types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string,
  meta?: PaginationMeta,
  requestId?: string
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    meta,
    requestId,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  meta: PaginationMeta,
  statusCode = 200,
  message?: string,
  requestId?: string
): Response {
  return sendSuccess(res, items, statusCode, message, meta, requestId);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorDetail[],
  requestId?: string
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    statusCode,
    error: {
      code,
      message,
      requestId,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
}
