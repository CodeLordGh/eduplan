import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import { PrismaClient } from '@eduflow/prisma';
import { createLogger } from '@eduflow/common';

import * as profileHandlers from './handlers/profile.handler';
import * as profileEvents from './events/profile.events';

// Initialize logger
const logger = createLogger({
  service: 'user-service',
  level: process.env.LOG_LEVEL || 'info'
});

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize event publisher (mock for now)
const publishEvent = async (event: string, data: unknown): Promise<void> => {
  logger.info({ event, data }, 'Publishing event');
};

// Create Fastify instance
const app = fastify({
  logger
});

// Register plugins
app.register(cors);
app.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
});
app.register(swagger, {
  routePrefix: '/docs',
  swagger: {
    info: {
      title: 'User Service API',
      description: 'API documentation for the User Service',
      version: '1.0.0'
    }
  },
  exposeRoute: true
});

// Dependencies
const deps = {
  prisma,
  publishEvent
};

// Register routes
app.get('/profiles/:userId', profileHandlers.getProfile(deps));
app.put('/profiles/:userId', profileHandlers.upsertProfile(deps));
app.patch('/profiles/:userId', profileHandlers.updateProfile(deps));
app.delete('/profiles/:userId', profileHandlers.deleteProfile(deps));
app.get('/profiles', profileHandlers.listProfiles(deps));

// Event handlers
const setupEventHandlers = () => {
  // Mock event subscription (replace with actual event system)
  const events = {
    USER_CREATED: profileEvents.handleUserCreated,
    USER_DELETED: profileEvents.handleUserDeleted,
    KYC_VERIFIED: profileEvents.handleKYCVerified
  };

  // Log registered event handlers
  logger.info(
    { events: Object.keys(events) },
    'Registered event handlers'
  );
};

// Start server
const start = async (): Promise<void> => {
  try {
    // Setup event handlers
    setupEventHandlers();

    // Start server
    await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0'
    });

    logger.info(
      { port: app.server.address() },
      'Server started successfully'
    );
  } catch (err) {
    logger.error(err, 'Error starting server');
    process.exit(1);
  }
};

// Handle shutdown
const shutdown = async (): Promise<void> => {
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
start(); 