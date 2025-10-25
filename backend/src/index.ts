import app from './app';
import { env } from './config/env';
import { pool } from './db/client';
import { runMigrations } from './db/migrate';
import logger from './utils/logger';

const startServer = async () => {
  try {
    await runMigrations();

    const client = await pool.connect();
    logger.info('Database connected successfully');
    client.release();

    app.listen(env.PORT, () => {
      logger.info(`Server is running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

startServer();
