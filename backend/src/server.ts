import { app } from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { prisma } from './prisma/client';
import { ensureBucket } from './shared/utils/storage';

async function start(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    await ensureBucket();
    logger.info('MinIO bucket ready');

    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await prisma.$disconnect();
  process.exit(0);
});

start();
