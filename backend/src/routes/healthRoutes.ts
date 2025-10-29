import { Router, Request, Response } from 'express';
import { pool } from '../db/client';
import logger from '../utils/logger';
import { generateCSRFToken } from '../utils/tokens';
import { env } from '../config/env';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  if (!req.cookies?.csrf_token) {
    const csrfToken = generateCSRFToken();
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('csrf_token', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      domain: env.COOKIE_DOMAIN ?? undefined,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbTimeout = 3000;
    const client = await pool.connect();

    const checkPromise = client.query('SELECT 1');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), dbTimeout);
    });

    await Promise.race([checkPromise, timeoutPromise]);
    client.release();

    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
