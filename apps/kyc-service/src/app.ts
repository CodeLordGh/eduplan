// import 'dotenv/config';
// import fastify, { FastifyInstance } from 'fastify';
// import cors from '@fastify/cors';
// import jwt from '@fastify/jwt';
// import swagger, { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
// import swaggerUi from '@fastify/swagger-ui';
// import { kycRoutes } from './routes/kyc.routes';
// import { errorHandler } from '@eduflow/common';
// import prisma from './lib/prisma';
// import fastifyRedis from '@fastify/redis';
// import { createLogger } from '@eduflow/logger';

// const logger = createLogger('kyc-service');

// export async function createApp(): Promise<FastifyInstance> {
//   const app = fastify({
//     logger: {
//       level: process.env.LOG_LEVEL || 'info',
//     },
//   });

//   // Register plugins
//   await app.register(cors, {
//     origin: process.env.CORS_ORIGIN || '*',
//   });

//   await app.register(jwt, {
//     secret: process.env.JWT_SECRET || 'your-secret-key',
//   });

//   // Register Redis
//   await app.register(fastifyRedis, {
//     url: process.env.REDIS_URL || 'redis://localhost:6379',
//   });

//   // Register Prisma
//   app.decorate('prisma', prisma);
//   app.addHook('onClose', async (app) => {
//     await app.prisma.$disconnect();
//   });

//   const swaggerOptions: FastifyDynamicSwaggerOptions = {
//     mode: 'dynamic',
//     openapi: {
//       info: {
//         title: 'KYC Service API',
//         description: 'API documentation for KYC Service',
//         version: '1.0.0',
//         contact: {
//           name: 'API Support',
//           email: 'support@eduflow.com',
//         },
//       },
//       servers: [
//         {
//           url: 'http://localhost:3004',
//           description: 'Development server',
          
//         },
//       ],
//       tags: [
//         { name: 'documents', description: 'KYC Document operations' },
//         { name: 'verification', description: 'Verification operations' },
//       ],
//       components: {
//         securitySchemes: {
//           bearerAuth: {
//             type: 'http',
//             scheme: 'bearer',
//             bearerFormat: 'JWT',
//           },
//         },
//         schemas: {
//           Error: {
//             type: 'object',
//             properties: {
//               error: { type: 'string' },
//               code: { type: 'string' },
//               statusCode: { type: 'number' },
//             },
//           },
//         },
//       },
//       security: [{ bearerAuth: [] }],
//     },
//     hideUntagged: true,
//   };

//   await app.register(swagger, swaggerOptions);

//   // Register Swagger UI
//   await app.register(swaggerUi, {
//     routePrefix: '/documentation',
//     uiConfig: {
//       docExpansion: 'list',
//       deepLinking: true,
//     },
//     staticCSP: false,
//   });

//   // Register routes with prefix
//   app.register(kycRoutes, { prefix: '/api/v1/kyc' });

//   // Log swagger documentation state after ready
//   app.addHook('onReady', async () => {
//     const swaggerDoc = app.swagger();
//     app.log.info(
//       `KYC Service documentation paths: ${Object.keys(swaggerDoc.paths || {}).join(', ')}`
//     );
//   });

//   // Error handler
//   app.setErrorHandler((error, request, reply) => errorHandler(logger, error, request, reply));

//   return app;
// }

// // Start the server if this file is run directly
// if (require.main === module) {
//   const start = async () => {
//     try {
//       const app = await createApp();
//       await app.listen({
//         port: parseInt(process.env.PORT || '3004'),
//         host: '0.0.0.0',
//       });
//       app.log.info(
//         `Documentation available at http://localhost:${process.env.PORT || '3004'}/documentation`
//       );
//     } catch (err) {
//       console.error(err);
//       process.exit(1);
//     }
//   };
//   start();
// }
