import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors.js';

function normalizeErrorCode(message: string) {
  const normalized = message
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

  return normalized.length > 0 ? normalized : 'INTERNAL_SERVER_ERROR';
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';
  const code = error instanceof AppError ? error.code : normalizeErrorCode(message);

  // Log the actual error for debugging (especially 500s)
  if (statusCode >= 500) {
    console.error('[ERROR]', {
      statusCode,
      code,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  res.status(statusCode).json({
    error: {
      code,
      message
    }
  });
}
