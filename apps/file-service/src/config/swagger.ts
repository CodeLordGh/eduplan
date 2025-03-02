import { FastifyInstance } from 'fastify';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createError, type BaseError } from '@eduflow/common';

export const initSwagger = (server: FastifyInstance): TE.TaskEither<BaseError, void> => {
  return pipe(
    TE.tryCatch(
      async () => {
        await server.register(require('@fastify/swagger'), {
          swagger: {
            info: {
              title: 'API Gateway',
              description: 'API Gateway for EduFlow platform',
              version: '1.0.0',
            },
            externalDocs: {
              url: 'https://eduflow.dev/docs',
              description: 'Find more info here',
            },
            host: process.env.API_HOST,
            schemes: ['http', 'https'],
            consumes: ['application/json'],
            produces: ['application/json'],
            tags: [
              { name: 'gateway', description: 'Gateway related end-points' },
            ],
            securityDefinitions: {
              apiKey: {
                type: 'apiKey',
                name: 'Authorization',
                in: 'header',
              },
            },
          },
        });

        await server.register(require('@fastify/swagger-ui'), {
          routePrefix: '/docs',
          swagger: {
            info: {
              title: 'API Gateway',
              description: 'API Gateway for EduFlow platform',
              version: '1.0.0',
            },
          },
          uiConfig: {
            docExpansion: 'full',
            deepLinking: false,
          },
          staticCSP: true,
          transformStaticCSP: (header: string) => header,
          exposeRoute: true,
        });
      },
      (error) => createError('Failed to initialize Swagger', 'SWAGGER_ERROR', 500, error)
    )
  );
};
