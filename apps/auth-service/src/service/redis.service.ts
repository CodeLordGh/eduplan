import { FastifyRedis } from '@fastify/redis';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Option } from 'fp-ts/Option';
import { AuthErrors, createDatabaseError } from '../errors/auth';
import { redisUtils } from '@eduflow/middleware';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';

export const storeRefreshToken = (
  redis: FastifyRedis,
  userId: string,
  token: string,
  expirySeconds: number
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    redisUtils.setRedisValue(redis)(`${REFRESH_TOKEN_PREFIX}${token}`, userId, expirySeconds),
    TE.mapLeft((error) => createDatabaseError(error as any)),
    TE.map(() => void 0)
  );

export const getRefreshTokenUserId = (
  redis: FastifyRedis,
  token: string
): TE.TaskEither<AuthErrors, Option<string>> =>
  pipe(
    redisUtils.getRedisValue(redis)(`${REFRESH_TOKEN_PREFIX}${token}`),
    TE.mapLeft((error) => createDatabaseError(error as any))
  );

export const deleteRefreshToken = (
  redis: FastifyRedis,
  token: string
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    redisUtils.deleteRedisValue(redis)(`${REFRESH_TOKEN_PREFIX}${token}`),
    TE.mapLeft((error) => createDatabaseError(error as any)),
    TE.map(() => void 0)
  );