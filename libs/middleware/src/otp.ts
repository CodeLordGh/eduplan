import { Redis } from 'ioredis';

const OTP_PREFIX = 'otp:';
const OTP_EXPIRY = 15 * 60; // 15 minutes in seconds

export const createOTPManager = (redis: Redis) => {
  const getKey = (userId: string) => `${OTP_PREFIX}${userId}`;

  return {
    store: async (userId: string, data: any) => {
      const key = getKey(userId);
      await redis.set(key, JSON.stringify(data), 'EX', OTP_EXPIRY);
    },

    verify: async (userId: string, code: string): Promise<boolean> => {
      const key = getKey(userId);
      const data = await redis.get(key);

      if (!data) {
        return false;
      }

      const otpData = JSON.parse(data);
      const isValid = otpData.code === code && Date.now() < otpData.expiresAt;

      if (isValid) {
        await redis.del(key);
      }

      return isValid;
    },

    clear: async (userId: string) => {
      const key = getKey(userId);
      await redis.del(key);
    },
  };
}; 