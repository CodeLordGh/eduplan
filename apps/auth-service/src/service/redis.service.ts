import { FastifyRedis } from '@fastify/redis';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Option } from 'fp-ts/Option';
import { AuthErrors, createDatabaseError } from '../errors/auth';
import { setRedisValue, getRedisValue, deleteRedisValue } from '@eduflow/middleware';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';

export const storeRefreshToken = (
  redis: FastifyRedis,
  userId: string,
  token: string,
  expirySeconds: number
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    setRedisValue(redis)(`${REFRESH_TOKEN_PREFIX}${token}`, userId, expirySeconds * 1000),
    TE.mapLeft((error) => createDatabaseError(error as Error)),
    TE.map(() => void 0)
  );

export const getRefreshTokenUserId = (
  redis: FastifyRedis,
  token: string
): TE.TaskEither<AuthErrors, Option<string>> =>
  pipe(
    getRedisValue(redis)(`${REFRESH_TOKEN_PREFIX}${token}`),
    TE.mapLeft((error) => createDatabaseError(error as Error))
  ) as TE.TaskEither<AuthErrors, Option<string>>;

export const deleteRefreshToken = (
  redis: FastifyRedis,
  token: string
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    deleteRedisValue(redis)(`${REFRESH_TOKEN_PREFIX}${token}`),
    TE.mapLeft((error) => createDatabaseError(error as Error)),
    TE.map(() => void 0)
  );
