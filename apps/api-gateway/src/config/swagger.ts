import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function setupSwagger(server: FastifyInstance) {
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'EduFlow API Documentation',
        description: 'Comprehensive API documentation for all EduFlow services',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:4000',
          description: 'Development server'
        }
      ],
      tags: [
        { name: 'auth', description: 'Authentication endpoints' },
        { name: 'users', description: 'User management endpoints' },
        { name: 'schools', description: 'School management endpoints' },
        { name: 'academic', description: 'Academic management endpoints' },
        { name: 'payments', description: 'Payment processing endpoints' },
        { name: 'kyc', description: 'KYC verification endpoints' },
        { name: 'files', description: 'File management endpoints' },
        { name: 'chat', description: 'Chat system endpoints' },
        { name: 'notifications', description: 'Notification system endpoints' }
      ]
    },hideUntagged: true // This will hide routes without tags
  });

  await server.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'none',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    },
    staticCSP: true
  });
} 