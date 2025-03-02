import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createError, type BaseError } from '@eduflow/common';

export const initSwagger = (server: FastifyInstance): TE.TaskEither<BaseError, void> => {
  return pipe(
    TE.tryCatch(
      async () => {
        await server.register(require('@fastify/swagger'), {
          openapi: {
            info: {
              title: 'API Gateway',
              description: 'API Gateway for EduFlow platform',
              version: '1.0.0',
              contact: {
                name: 'API Support',
                email: 'support@eduflow.com'
              }
            },
            externalDocs: {
              url: 'https://eduflow.dev/docs',
              description: 'Find more info here'
            },
            servers: [
              {
                url: process.env.API_URL || 'http://localhost:3000',
                description: 'API Gateway'
              }
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
            tags: [
              { name: 'auth', description: 'Authentication endpoints' },
              { name: 'users', description: 'User management endpoints' },
              { name: 'schools', description: 'School management endpoints' },
              { name: 'kyc', description: 'KYC verification endpoints' }
            ],
            security: [{ bearerAuth: [] }]
          }
        });

        await server.register(require('@fastify/swagger-ui'), {
          routePrefix: '/documentation',
          uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
            persistAuthorization: true
          },
          staticCSP: true,
          transformStaticCSP: (header: string) => header,
          // Add hooks to explicitly allow public access
          uiHooks: {
            onRequest: (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
              // Skip auth for documentation
              done();
            }
          }
        });

      },
      (error) => createError('Failed to initialize Swagger', 'SWAGGER_ERROR', 500, error)
    )
  );
};