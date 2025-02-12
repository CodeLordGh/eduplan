import { Redis } from 'ioredis';
import { Role } from '@eduflow/prisma';
import { createApp } from '../app';
import * as otpService from '../service/otp.service';
import { clearRedis, createTestUser } from './helpers';

describe('OTP Service', () => {
  let app: any;
  let redis: Redis;

  beforeAll(async () => {
    app = await createApp();
    redis = app.redis;
  }, 30000); // 30 second timeout

  beforeEach(async () => {
    await clearRedis(redis);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('generateOTP', () => {
    it('should generate and store OTP successfully', async () => {
      const user = await createTestUser('test@example.com', Role.STUDENT);

      const result = await otpService.generateOTP(
        redis,
        user.id,
        'test@example.com',
        otpService.OTPPurpose.EMAIL_VERIFICATION
      )();

      expect(result._tag).toBe('Right');
      if (result._tag === 'Right') {
        expect(result.right).toHaveLength(6);
      }
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP successfully', async () => {
      const user = await createTestUser('test@example.com', Role.STUDENT);

      const generateResult = await otpService.generateOTP(
        redis,
        user.id,
        'test@example.com',
        otpService.OTPPurpose.EMAIL_VERIFICATION
      )();

      expect(generateResult._tag).toBe('Right');
      if (generateResult._tag === 'Right') {
        const verifyResult = await otpService.verifyOTP(
          redis,
          user.id,
          generateResult.right,
          otpService.OTPPurpose.EMAIL_VERIFICATION
        )();

        expect(verifyResult._tag).toBe('Right');
        if (verifyResult._tag === 'Right') {
          expect(verifyResult.right).toBe(true);
        }
      }
    });

    it('should reject invalid OTP', async () => {
      const user = await createTestUser('test@example.com', Role.STUDENT);

      const verifyResult = await otpService.verifyOTP(
        redis,
        user.id,
        'INVALID',
        otpService.OTPPurpose.EMAIL_VERIFICATION
      )();

      expect(verifyResult._tag).toBe('Right');
      if (verifyResult._tag === 'Right') {
        expect(verifyResult.right).toBe(false);
      }
    });
  });
});
