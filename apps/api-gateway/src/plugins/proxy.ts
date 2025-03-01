import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { createLogger } from '@eduflow/logger';
import { serviceConfig } from '../config/services';
import { createProxyHandler } from '../lib/proxy';

const logger = createLogger('proxy-plugin');

const proxyPlugin: FastifyPluginAsync = async (fastify) => {
  for (const service of serviceConfig.services) {
    const handler = createProxyHandler(service);
    
    fastify.all(`${service.prefix}/*`, async (request, reply) => {
      logger.debug('Proxying request', {
        service: service.name,
        path: request.url,
        method: request.method
      });
      
      return handler(request, reply);
    });

    logger.info('Registered proxy routes', {
      service: service.name,
      prefix: service.prefix
    });
  }
};

export default fp(proxyPlugin, {
  name: 'proxy-plugin'
});