import { FastifyPluginAsync, FastifyInstance, RawServerDefault, FastifyBaseLogger, FastifyTypeProviderDefault } from 'fastify';
import { createLogger } from '@eduflow/logger';
import { serviceStatusRoutes } from '../routes/service-status';
import fp from 'fastify-plugin';

const logger = createLogger('service-status-plugin');

interface ServiceStatusPluginOptions {}

const plugin: FastifyPluginAsync<
  ServiceStatusPluginOptions,
  RawServerDefault,
  FastifyTypeProviderDefault
> = async (fastify: FastifyInstance) => {
  try {
    logger.info('Registering service status plugin');
    await fastify.register(serviceStatusRoutes);
    logger.info('Service status plugin registered successfully');
  } catch (error: unknown) {
    logger.error('Failed to register service status plugin', { error });
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export default fp(plugin, {
  name: 'service-status-plugin',
  fastify: '4.x'
});