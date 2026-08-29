import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  logger.error('unhandled_error', { requestId: req.requestId, method: req.method, path: req.path, error: err });
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
