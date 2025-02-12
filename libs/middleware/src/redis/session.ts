import { Redis } from 'ioredis';
import { FastifyRequest, FastifyReply } from 'fastify';
import { pipe } from 'fp-ts/function';
import { SessionData } from './types';
import { getHeaderValue, createSessionKey, getRedisValue, parseJSON } from './utils';
import { sendUnauthorized } from './response';

export const createSessionMiddleware =
  (redis: Redis) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const sessionId = pipe(request.headers, (headers) => getHeaderValue(headers, 'session-id'));

    if (sessionId._tag === 'None') {
      sendUnauthorized(reply, 'No session ID provided');
      return;
    }

    const sessionData = await pipe(sessionId.value, createSessionKey, getRedisValue(redis))();

    if (sessionData._tag === 'Left') {
      sendUnauthorized(reply, 'Session error');
      return;
    }

    if (sessionData.right._tag === 'None') {
      sendUnauthorized(reply, 'Invalid or expired session');
      return;
    }

    const session = pipe(sessionData.right.value, (data) => parseJSON<SessionData>(data));

    if (session._tag === 'None') {
      sendUnauthorized(reply, 'Invalid session data');
      return;
    }

    request.session = session.value;
  };
