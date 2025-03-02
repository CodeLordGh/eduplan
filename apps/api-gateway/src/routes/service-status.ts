import { FastifyPluginAsync } from 'fastify';
import { getAllServices, getServiceInfo } from '../store/service-registry';

export const serviceStatusRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/services', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceName: { type: 'string' },
              status: { type: 'string', enum: ['up', 'down'] },
              endpoints: { type: 'array', items: { type: 'string' } },
              circuitBreakerStatus: { type: 'string', enum: ['open', 'closed', 'half-open'] },
              lastUpdated: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    handler: async () => {
      return getAllServices();
    }
  });

  fastify.get('/api/services/:serviceName', {
    schema: {
      params: {
        type: 'object',
        required: ['serviceName'],
        properties: {
          serviceName: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            serviceName: { type: 'string' },
            status: { type: 'string', enum: ['up', 'down'] },
            endpoints: { type: 'array', items: { type: 'string' } },
            circuitBreakerStatus: { type: 'string', enum: ['open', 'closed', 'half-open'] },
            lastUpdated: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      const { serviceName } = request.params as { serviceName: string };
      const serviceInfo = getServiceInfo(serviceName);
      
      if (!serviceInfo) {
        return reply.status(404).send({ 
          error: `Service '${serviceName}' not found` 
        });
      }
      
      return serviceInfo;
    }
  });
};