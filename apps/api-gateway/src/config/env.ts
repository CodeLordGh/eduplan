import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { createAppError } from '@eduflow/common';

export interface EnvConfig {
  readonly PORT: number;
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly REDIS_HOST: string;
  readonly REDIS_PORT: number;
  readonly REDIS_PASSWORD: string;
  readonly REDIS_DB: number;
  readonly JWT_SECRET: string;
  readonly RATE_LIMIT_WINDOW_MS: number;
  readonly RATE_LIMIT_MAX_REQUESTS: number;
}

const getEnvVar = (key: string): O.Option<string> =>
  pipe(
    process.env[key],
    O.fromNullable
  );

const parseNumber = (value: string): E.Either<Error, number> =>
  pipe(
    Number(value),
    (n) => isNaN(n) ? E.left(createAppError({
      code: 'VALIDATION_ERROR',
      message: `Invalid number: ${value}`,
    })) : E.right(n)
  );

const validateNodeEnv = (env: string): E.Either<Error, 'development' | 'production' | 'test'> =>
  env === 'development' || env === 'production' || env === 'test'
    ? E.right(env as 'development' | 'production' | 'test')
    : E.left(createAppError({
      code: 'VALIDATION_ERROR',
      message: `Invalid NODE_ENV: ${env}`,
    }));

const getEnvNumber = (key: string, defaultValue: string): E.Either<Error, number> =>
  pipe(
    getEnvVar(key),
    O.getOrElse(() => defaultValue),
    parseNumber
  );

const getEnvString = (key: string, defaultValue: string): string =>
  pipe(
    getEnvVar(key),
    O.getOrElse(() => defaultValue)
  );

export const loadEnvConfig = (): E.Either<Error, EnvConfig> => {
  const port = getEnvNumber('PORT', '3000');
  const nodeEnv = pipe(
    getEnvVar('NODE_ENV'),
    O.getOrElse(() => 'development'),
    validateNodeEnv
  );
  const redisPort = getEnvNumber('REDIS_PORT', '6379');
  const redisDb = getEnvNumber('REDIS_DB', '0');
  const rateLimitWindowMs = getEnvNumber('RATE_LIMIT_WINDOW_MS', '900000');
  const rateLimitMaxRequests = getEnvNumber('RATE_LIMIT_MAX_REQUESTS', '100');

  return pipe(
    E.right((p: number) => (ne: 'development' | 'production' | 'test') => (rp: number) => (rd: number) => (rlw: number) => (rlm: number) => ({
      PORT: p,
      NODE_ENV: ne,
      REDIS_HOST: getEnvString('REDIS_HOST', 'localhost'),
      REDIS_PORT: rp,
      REDIS_PASSWORD: getEnvString('REDIS_PASSWORD', ''),
      REDIS_DB: rd,
      JWT_SECRET: getEnvString('JWT_SECRET', 'default-secret-key'),
      RATE_LIMIT_WINDOW_MS: rlw,
      RATE_LIMIT_MAX_REQUESTS: rlm
    })),
    E.ap(port),
    E.ap(nodeEnv),
    E.ap(redisPort),
    E.ap(redisDb),
    E.ap(rateLimitWindowMs),
    E.ap(rateLimitMaxRequests)
  );
}; 