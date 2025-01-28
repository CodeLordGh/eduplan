import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

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
          server.log.info(`Fetching documentation from ${service.name} at ${service.url}`);
          const response = await fetch(service.url);
          if (!response.ok) {
            server.log.warn(`Failed to fetch documentation from ${service.name}: ${response.statusText}`);
            continue;
          }
          
          const serviceDoc = await response.json();
          server.log.info(`Successfully fetched documentation from ${service.name}`);
          server.log.info(`Service paths: ${Object.keys(serviceDoc.paths || {}).join(', ')}`);
          
          const swaggerObject = server.swagger();
          
          // Merge paths with prefix if not already prefixed
          if (serviceDoc.paths) {
            for (const [path, pathItem] of Object.entries(serviceDoc.paths)) {
              const finalPath = path.startsWith(service.prefix) ? path : `${service.prefix}${path}`;
              server.log.info(`Merging path ${path} as ${finalPath}`);
              if (!swaggerObject.paths) swaggerObject.paths = {};
              swaggerObject.paths[finalPath] = JSON.parse(JSON.stringify(pathItem));
            }
          }

          server.swagger({ ...swaggerObject, yaml: false });
          server.log.info(`Documentation merged successfully for ${service.name}`);
          server.log.info(`Total paths after merge: ${Object.keys(swaggerObject.paths || {}).length}`);
        } catch (error) {
          server.log.warn(`Failed to fetch documentation from ${service.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      server.log.error(`Failed to aggregate service documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
} 