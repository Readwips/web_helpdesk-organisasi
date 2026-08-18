import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
