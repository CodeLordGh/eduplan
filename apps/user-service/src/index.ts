import { FastifyInstance } from 'fastify';
import { createLogger } from '@eduflow/common';
import { authenticate, authorize } from '@eduflow/middleware';
import type { PrismaClient } from '@eduflow/types';
import * as profileHandlers from './handlers/profile.handler';
import { prisma } from '@eduflow/prisma';

// Initialize logger
const logger = createLogger('user-service');

// Dependencies
const deps: {
  prisma: PrismaClient;
  publishEvent: (event: string, data: unknown) => Promise<void>;
} = {
  prisma: prisma as unknown as PrismaClient,
  publishEvent: async (event: string, data: unknown) => {
    logger.info('Publishing event', { event, data });
    // TODO: Implement event publishing
  }
};

// Create Fastify app
const app: FastifyInstance = require('fastify')({
  logger: true
});

// Add error handler
app.setErrorHandler((error, request, reply) => {
  logger.error('Request error', error, { url: request.url, method: request.method });
  reply.status(500).send({ error: 'Internal Server Error' });
});

// Register Swagger
app.register(require('@fastify/swagger'), {
  swagger: {
    info: {
      title: 'User Service API',
      description: 'API documentation for the User Service',
      version: '1.0.0'
    },
    host: 'localhost',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

// Register routes
app.get('/profiles/:userId', profileHandlers.getProfile(deps));
app.put('/profiles/:userId', profileHandlers.upsertProfile(deps));
app.patch('/profiles/:userId', profileHandlers.updateProfile(deps));
app.delete('/profiles/:userId', profileHandlers.deleteProfile(deps));
app.get('/profiles', profileHandlers.listProfiles(deps));

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await app.listen({ port: Number(port), host: '0.0.0.0' });
    logger.info('Server started', { port });
  } catch (err) {
    logger.error('Server start failed', err instanceof Error ? err : new Error('Unknown error'));
    process.exit(1);
  }
};

start(); 