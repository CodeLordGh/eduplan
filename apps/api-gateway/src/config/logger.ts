import { createLogger, createRequestLogger, createErrorLogger } from '@eduflow/logger';
import { FastifyRequest } from 'fastify';

// Create base logger instance
export const logger = createLogger({
  service: 'api-gateway',
  environment: process.env.NODE_ENV || 'development',
  minLevel: 'info'
});

// Create request logger middleware
export const requestLogger = createRequestLogger(logger);

// Create error logger utility
export const errorLogger = createErrorLogger(logger);

// Create request context utility
export const createRequestContext = (request: FastifyRequest) => ({
  service: 'api-gateway',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  correlationId: request.headers['x-correlation-id'] as string || request.id,
  method: request.method,
  url: request.url,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  userId: (request as any).user?.id
}); 