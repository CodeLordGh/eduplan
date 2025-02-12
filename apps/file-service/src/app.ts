import fastify from 'fastify';
import multipart from '@fastify/multipart';
import { pipe } from 'fp-ts/function';
import pino from 'pino';
import { createLogger } from '@eduflow/common';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  name: 'file-service',
});

const app = fastify({
  logger,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
    },
  },
});

// Register plugins
app.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 5, // Max 5 files per request
  },
});

// Register routes
const start = async () => {
  try {
    // Register route handlers
    await app.register(import('./routes/upload.routes'), { prefix: '/api/v1/files' });
    // await app.register(import('./routes/access.routes'), { prefix: '/api/v1/files' });
    // await app.register(import('./routes/quota.routes'), { prefix: '/api/v1/quotas' });

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    logger.info(`Server is running on http://${host}:${port}`);
  } catch (err) {
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error('An unknown error occurred');
    }
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  if (err instanceof Error) {
    logger.error(err.message);
  } else {
    logger.error('An unhandled rejection occurred');
  }
  process.exit(1);
});

start();
