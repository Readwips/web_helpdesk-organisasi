import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const suppliedId = req.header('x-request-id');
  req.requestId = suppliedId && /^[a-zA-Z0-9._-]{1,100}$/.test(suppliedId) ? suppliedId : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    logger.info('http_request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
    });
  });
  next();
};
