import { JWT } from '@fastify/jwt';
import { AuthenticatedUser } from './auth.middleware';
import { SessionData } from './redis.middleware';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: AuthenticatedUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JWT;
  }
  interface FastifyRequest {
    jwtVerify(): Promise<AuthenticatedUser>;
    session: SessionData;
  }
}

export interface MiddlewareConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  session?: {
    ttl?: number;
    prefix?: string;
  };
  rateLimit?: {
    windowMs?: number;
    max?: number;
    keyPrefix?: string;
  };
  cache?: {
    ttl?: number;
    prefix?: string;
  };
} 