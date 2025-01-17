import { Redis } from 'ioredis';
import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { CacheConfig } from './types';
import { createCacheKey, setRedisValue, getRedisValue, parseJSON, deleteRedisValue } from './utils';

export const createCacheManager = (redis: Redis) => ({
  get: <T>(key: string, prefix = 'cache:'): TaskEither<Error, O.Option<T>> =>
    pipe(
      createCacheKey(key, prefix),
      getRedisValue(redis),
      TE.chain(optionStr =>
        TE.right(
          pipe(
            optionStr,
            O.chain(str => parseJSON<T>(str))
          )
        )
      )
    ),

  set: <T>(key: string, data: T, { ttl, prefix = 'cache:' }: CacheConfig): TaskEither<Error, boolean> =>
    pipe(
      createCacheKey(key, prefix),
      cacheKey => setRedisValue(redis)(cacheKey, JSON.stringify(data), ttl)
    ),

  delete: (key: string, prefix = 'cache:'): TaskEither<Error, boolean> =>
    pipe(
      createCacheKey(key, prefix),
      deleteRedisValue(redis)
    )
}); 