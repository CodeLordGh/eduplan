import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Logger } from '@eduflow/logger';
import { AppError } from '@eduflow/types';
import { createAppError } from '@eduflow/common';
import {
  getRedisClient,
  incrementRedisValue,
  setRedisExpiry,
  getRedisTimeToLive,
  createRateLimitKey,
} from '@eduflow/middleware';
import { OperationContext } from './types';
import { Redis } from 'ioredis';

const DEFAULT_WINDOW = 15 * 60; // 15 minutes in seconds
const DEFAULT_MAX_REQUESTS = 100;

/**
 * Check rate limit for school registration operations
 * This is specific to school registration business logic and separate from
 * the generic HTTP rate limiting middleware
 */
export const checkSchoolRegistrationRateLimit = (
  context: OperationContext,
  logger: Logger
): TE.TaskEither<AppError, void> => {
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '') || DEFAULT_WINDOW;
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '') || DEFAULT_MAX_REQUESTS;

  const key = createRateLimitKey(context.clientInfo.ip, 'school_registration:');

  return pipe(
    getRedisClient(),
    TE.chain((client: Redis) =>
      pipe(
        incrementRedisValue(client)(key),
        TE.chain((count: number) =>
          count === 1
            ? pipe(
                setRedisExpiry(client)(key, window * 1000),
                TE.map(() => count)
              )
            : TE.right(count)
        ),
        TE.mapLeft((error) => createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Rate limit check failed',
          cause: error
        })),
        TE.chain((count: number) =>
          pipe(
            getRedisTimeToLive(client)(key),
            TE.chain((ttl: number) => {
              logger.debug('School registration rate limit check', {
                ip: context.clientInfo.ip,
                count,
                limit: maxRequests,
                resetIn: Math.ceil(ttl / 1000),
              });

              if (count > maxRequests) {
                return TE.left(
                  createAppError({
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'School registration rate limit exceeded',
                    metadata: {
                      service: 'school-service',
                      operation: 'school-registration-rate-limit',
                      timestamp: new Date(),
                    },
                  })
                );
              }

              return TE.right(undefined);
            })
          )
        )
      )
    )
  );
};
