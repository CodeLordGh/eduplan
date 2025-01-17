import { PrismaClient } from '@eduflow/prisma';
import { FastifyRedis } from '@fastify/redis';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: FastifyRedis;
  }
} 