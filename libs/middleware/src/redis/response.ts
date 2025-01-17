import { FastifyReply } from 'fastify';

export const sendUnauthorized = (reply: FastifyReply, message: string): void => {
  reply.status(401).send({ error: message });
};

export const sendTooManyRequests = (reply: FastifyReply, retryAfter: number): void => {
  reply.status(429).send({
    error: 'Too many requests',
    retryAfter: Math.ceil(retryAfter / 1000)
  });
};

export const setRateLimitHeaders = (reply: FastifyReply, max: number, remaining: number, reset: number): void => {
  reply.header('X-RateLimit-Limit', max);
  reply.header('X-RateLimit-Remaining', Math.max(0, remaining));
  reply.header('X-RateLimit-Reset', reset);
}; 