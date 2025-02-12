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
              title: 'File Service API',
              description: 'API documentation for the EduPlan File Service',
              version: '1.0.0',
            },
            externalDocs: {
              url: 'https://eduplan.dev/docs',
              description: 'Find more info here',
            },
            host: process.env.API_HOST,
            schemes: ['http', 'https'],
            consumes: ['application/json', 'multipart/form-data'],
            produces: ['application/json'],
            tags: [
              { name: 'files', description: 'File related end-points' },
              { name: 'quota', description: 'Storage quota related end-points' },
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
          routePrefix: '/documentation',
          uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
          },
        });
      },
      (error) => createError('Failed to initialize Swagger', 'SWAGGER_ERROR', 500, error)
    )
  );
};
