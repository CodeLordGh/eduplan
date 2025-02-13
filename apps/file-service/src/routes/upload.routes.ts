import { FastifyPluginAsync } from 'fastify';
import { pipe } from 'fp-ts/function';

const routes: FastifyPluginAsync = async (fastify) => {
  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'file-service' };
  });

  // TODO: Implement file upload endpoints
  // POST /upload - Upload a new file
  // POST /upload/batch - Upload multiple files
};

export default routes;
