import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : 'Internal server error';

  res.status(statusCode).json({
    error: {
      message
    }
  });
}
