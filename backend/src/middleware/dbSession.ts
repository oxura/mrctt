import { Request, Response, NextFunction } from 'express';
import { PoolClient } from 'pg';
import { pool } from '../db/client';
import logger from '../utils/logger';

export const dbSession = async (req: Request, res: Response, next: NextFunction) => {
  const skipPaths = ['/api/v1/health', '/api/v1/ready'];
  const originalPath = req.originalUrl.split('?')[0];

  if (skipPaths.includes(originalPath)) {
    return next();
  }

  let client: PoolClient | null = null;
  let transactionStarted = false;
  let cleanedUp = false;

  const cleanup = async (err?: Error) => {
    if (cleanedUp || !client) {
      return;
    }

    cleanedUp = true;

    try {
      if (transactionStarted) {
        if (err) {
          await client.query('ROLLBACK');
          logger.debug('Transaction rolled back', {
            requestId: req.requestId,
            tenantId: req.tenantId,
            error: err?.message,
          });
        } else {
          await client.query('COMMIT');
          logger.debug('Transaction committed', {
            requestId: req.requestId,
            tenantId: req.tenantId,
          });
        }
      }
    } catch (cleanupError) {
      logger.error('Error during transaction cleanup', {
        requestId: req.requestId,
        error: cleanupError,
      });
    } finally {
      client.release();
      client = null;
    }
  };

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    if (req.tenantId) {
      await client.query('SET LOCAL app.tenant_id = $1', [req.tenantId]);
    }

    req.db = client;

    res.on('finish', () => {
      cleanup().catch((err) => {
        logger.error('Error in finish cleanup', {
          requestId: req.requestId,
          error: err,
        });
      });
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        cleanup(new Error('Response closed before finish')).catch((err) => {
          logger.error('Error in close cleanup', {
            requestId: req.requestId,
            error: err,
          });
        });
      }
    });

    next();
  } catch (error) {
    await cleanup(error instanceof Error ? error : new Error('Unknown database error'));
    next(error);
  }
};
