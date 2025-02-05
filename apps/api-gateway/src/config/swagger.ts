import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from './logger';

export async function setupSwagger(server: FastifyInstance) {
  // Register base Swagger configuration
  await server.register(swagger, {
    mode: 'dynamic',
    openapi: {
      info: {
        title: 'EduFlow API Documentation',
        description: 'Comprehensive API documentation for all EduFlow services',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:4000/api/v1',
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
        { name: 'documents', description: 'KYC Document operations' },
        { name: 'verification', description: 'Verification operations' },
        { name: 'files', description: 'File management endpoints' },
        { name: 'chat', description: 'Chat system endpoints' },
        { name: 'notifications', description: 'Notification system endpoints' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  });

  // Register Swagger UI with CSP disabled for development
  await server.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'none',
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      persistAuthorization: true
    },
    staticCSP: false
  });

  // Add hook to fetch and merge documentation from services
  server.addHook('onReady', async () => {
    try {
      const services = [
        { url: 'http://localhost:3002/documentation/json', name: 'KYC Service', prefix: '/api/v1/kyc' }
      ];

      for (const service of services) {
        try {
          logger.info('Fetching service documentation', { 
            service: service.name, 
            url: service.url 
          });
          
          const response = await fetch(service.url);
          if (!response.ok) {
            logger.warn('Failed to fetch service documentation', { 
              service: service.name, 
              statusCode: response.status,
              statusText: response.statusText 
            });
            continue;
          }
          
          const serviceDoc = await response.json();
          logger.info('Successfully fetched service documentation', { 
            service: service.name,
            pathCount: Object.keys(serviceDoc.paths || {}).length,
            paths: Object.keys(serviceDoc.paths || {})
          });
          
          const swaggerObject = server.swagger();
          
          // Merge paths with prefix if not already prefixed
          if (serviceDoc.paths) {
            for (const [path, pathItem] of Object.entries(serviceDoc.paths)) {
              const finalPath = path.startsWith(service.prefix) ? path : `${service.prefix}${path}`;
              logger.debug('Merging service path', { 
                service: service.name,
                originalPath: path,
                finalPath: finalPath 
              });
              if (!swaggerObject.paths) swaggerObject.paths = {};
              swaggerObject.paths[finalPath] = JSON.parse(JSON.stringify(pathItem));
            }
          }

          server.swagger({ ...swaggerObject, yaml: false });
          logger.info('Service documentation merged successfully', { 
            service: service.name,
            totalPaths: Object.keys(swaggerObject.paths || {}).length 
          });
        } catch (error) {
          logger.error('Failed to process service documentation', {
            service: service.name,
            error: error instanceof Error ? error.stack : error
          });
        }
      }
    } catch (error) {
      logger.error('Failed to aggregate service documentation', {
        error: error instanceof Error ? error.stack : error
      });
    }
  });
} 