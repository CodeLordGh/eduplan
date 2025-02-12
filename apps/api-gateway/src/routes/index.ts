import { FastifyInstance } from 'fastify';

export async function setupRoutes(server: FastifyInstance) {
  // Add any gateway-specific routes here
  server.get('/', async () => {
    return {
      name: 'EduFlow API Gateway',
      version: '1.0.0',
      documentation: '/documentation',
    };
  });
}
