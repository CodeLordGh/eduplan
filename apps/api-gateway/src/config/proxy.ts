import { FastifyInstance } from 'fastify';
import httpProxy from 'http-proxy';
import { createLogger } from '@eduflow/common';
import { ServerResponse } from 'http';

const logger = createLogger('proxy-config');

interface ServiceConfig {
  name: string;
  prefix: string;
  target: string;
  auth: boolean;
}

const services: ServiceConfig[] = [
  {
    name: 'auth',
    prefix: '/api/v1/auth',
    target: 'http://localhost:3001',
    auth: false
  },
  {
    name: 'user',
    prefix: '/api/v1/users',
    target: 'http://localhost:3002',
    auth: true
  },
  {
    name: 'kyc',
    prefix: '/api/v1/kyc',
    target: 'http://localhost:3003',
    auth: true
  },
  {
    name: 'school',
    prefix: '/api/v1/schools',
    target: 'http://localhost:3004',
    auth: true
  },
  {
    name: 'academic',
    prefix: '/api/v1/academic',
    target: 'http://localhost:3005',
    auth: true
  },
  {
    name: 'payment',
    prefix: '/api/v1/payments',
    target: 'http://localhost:3006',
    auth: true
  },
  {
    name: 'file',
    prefix: '/api/v1/files',
    target: 'http://localhost:3007',
    auth: true
  },
  {
    name: 'chat',
    prefix: '/api/v1/chat',
    target: 'http://localhost:3008',
    auth: true
  },
  {
    name: 'notification',
    prefix: '/api/v1/notifications',
    target: 'http://localhost:3009',
    auth: true
  }
];

export async function setupProxies(server: FastifyInstance) {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true
  });

  // Handle proxy errors
  proxy.on('error', (err, _req, res) => {
    logger.error('Proxy error:', err);
    if (res instanceof ServerResponse && !res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error occurred' }));
    }
  });

  // Register proxy routes
  services.forEach(service => {
    server.all(`${service.prefix}/*`, async (request, reply) => {
      // Skip auth check for non-auth required endpoints
      if (service.auth) {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.code(401).send({ error: 'Unauthorized' });
          return;
        }
      }

      return new Promise((resolve, reject) => {
        proxy.web(request.raw, reply.raw, {
          target: service.target,
          selfHandleResponse: false
        }, (err) => {
          if (err) {
            reject(err);
          }
        });
      });
    });
  });

  // Health check endpoint
  server.get('/health', async () => {
    return { status: 'ok' };
  });
} 