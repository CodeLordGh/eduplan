import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from './logger';

interface SwaggerOperation {
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: {
          $ref?: string;
        };
      };
    };
  };
  responses?: {
    [key: string]: {
      content?: {
        'application/json'?: {
          schema?: {
            $ref?: string;
          };
        };
      };
    };
  };
}

interface SwaggerPathItem {
  [method: string]: SwaggerOperation;
}

interface SwaggerDocument {
  paths: {
    [path: string]: SwaggerPathItem;
  };
  components?: {
    schemas?: {
      [key: string]: unknown;
    };
  };
}

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
        { url: 'http://localhost:3001/documentation/json', name: 'Auth Service', prefix: '/api/v1/auth' },
        { url: 'http://localhost:3002/documentation/json', name: 'KYC Service', prefix: '/api/v1/kyc' },
        { url: 'http://localhost:3003/documentation/json', name: 'User Service', prefix: '/api/v1/users' },
        { url: 'http://localhost:3004/documentation/json', name: 'School Service', prefix: '/api/v1/schools' },
        { url: 'http://localhost:3005/documentation/json', name: 'Academic Service', prefix: '/api/v1/academic' },
        { url: 'http://localhost:3006/documentation/json', name: 'Payment Service', prefix: '/api/v1/payments' },
        { url: 'http://localhost:3007/documentation/json', name: 'File Service', prefix: '/api/v1/files' },
        { url: 'http://localhost:3008/documentation/json', name: 'Chat Service', prefix: '/api/v1/chat' },
        { url: 'http://localhost:3009/documentation/json', name: 'Notification Service', prefix: '/api/v1/notifications' }
      ];

      const swaggerObject = server.swagger() as SwaggerDocument;
      swaggerObject.paths = swaggerObject.paths || {};
      swaggerObject.components = swaggerObject.components || {};
      swaggerObject.components.schemas = swaggerObject.components.schemas || {};

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
          
          // Merge paths with prefix if not already prefixed
          if (serviceDoc.paths) {
            for (const [path, pathItem] of Object.entries(serviceDoc.paths)) {
              const finalPath = path.startsWith(service.prefix) ? path : `${service.prefix}${path}`;
              logger.debug('Merging service path', { 
                service: service.name,
                originalPath: path,
                finalPath: finalPath 
              });
              swaggerObject.paths[finalPath] = JSON.parse(JSON.stringify(pathItem));
            }
          }

          // Merge components/schemas if available
          if (serviceDoc.components?.schemas) {
            for (const [schemaName, schema] of Object.entries(serviceDoc.components.schemas)) {
              const prefixedSchemaName = `${service.name.replace(' ', '')}_${schemaName}`;
              swaggerObject.components.schemas[prefixedSchemaName] = JSON.parse(JSON.stringify(schema));
              
              // Update references in paths to use the prefixed schema name
              Object.values(swaggerObject.paths).forEach(pathItem => {
                Object.values(pathItem as SwaggerPathItem).forEach(operation => {
                  const op = operation as SwaggerOperation;
                  if (op.requestBody?.content?.['application/json']?.schema?.$ref) {
                    op.requestBody.content['application/json'].schema.$ref = 
                      op.requestBody.content['application/json'].schema.$ref.replace(
                        `#/components/schemas/${schemaName}`,
                        `#/components/schemas/${prefixedSchemaName}`
                      );
                  }
                  op.responses && Object.values(op.responses).forEach(response => {
                    if (response.content?.['application/json']?.schema?.$ref) {
                      response.content['application/json'].schema.$ref = 
                        response.content['application/json'].schema.$ref.replace(
                          `#/components/schemas/${schemaName}`,
                          `#/components/schemas/${prefixedSchemaName}`
                        );
                    }
                  });
                });
              });
            }
          }

          server.swagger({ ...swaggerObject, yaml: false });
          logger.info('Service documentation merged successfully', { 
            service: service.name,
            totalPaths: Object.keys(swaggerObject.paths).length,
            totalSchemas: Object.keys(swaggerObject.components.schemas).length
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