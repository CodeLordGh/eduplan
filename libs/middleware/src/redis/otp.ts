import { Redis } from 'ioredis';
import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/TaskEither';
import { OTPData } from './types';
import { createOTPKey, setRedisValue, getRedisValue, parseJSON, deleteRedisValue } from './utils';

export const createOTPManager = (redis: Redis) => ({
  store: (userId: string, otpData: OTPData): TaskEither<Error, boolean> =>
    pipe(createOTPKey(userId), (key) =>
      setRedisValue(redis)(key, JSON.stringify(otpData), otpData.expiresAt - Date.now())
    ),

  verify: async (userId: string, code: string): Promise<boolean> => {
    const otpData = await pipe(createOTPKey(userId), getRedisValue(redis))();

    if (otpData._tag === 'Left' || otpData.right._tag === 'None') {
      return false;
    }

    const parsedOTP = pipe(otpData.right.value, (data) => parseJSON<OTPData>(data));

    if (parsedOTP._tag === 'None') {
      return false;
    }

    const isValid = parsedOTP.value.code === code && Date.now() <= parsedOTP.value.expiresAt;
    if (isValid) {
      await deleteRedisValue(redis)(createOTPKey(userId))();
    }

    return isValid;
  },
});
