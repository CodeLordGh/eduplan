import fastify from 'fastify';
import { createLogger } from '@eduflow/logger';

const logger = createLogger('payment-service');

const app = fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true,
    },
  },
});

// Register routes
const start = async () => {
  try {
    // Register route handlers
    await app.register(import('./routes/payment.routes'), { prefix: '/api/v1/payments' });

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3007;
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