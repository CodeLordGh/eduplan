import { Redis } from 'ioredis';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { createOTPManager } from '@eduflow/middleware';
import { AuthErrors, createDatabaseError, createValidationError } from '../errors/auth';
import { sendOTPEmail } from './email.service';
import { createLogger } from '@eduflow/common';
import * as E from 'fp-ts/Either';
import { OTPData, OTPPurpose } from '../domain/types';
import { PrismaClient, OTPStatus } from '@eduflow/prisma';

const logger = createLogger('otp-service');
const prisma = new PrismaClient();

const OTP_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_OTP_ATTEMPTS = 3;
const OTP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const getAttemptKey = (userId: string) => `otp:attempts:${userId}`;
const getBlockKey = (userId: string) => `otp:blocked:${userId}`;

export const generateOTP = (
  redis: Redis,
  userId: string,
  email: string,
  purpose: OTPPurpose
): TE.TaskEither<AuthErrors, string> =>
  pipe(
    TE.tryCatch(
      async () => {
        // Check if user is blocked
        const isBlocked = await redis.get(getBlockKey(userId));
        if (isBlocked) {
          throw new Error('Too many failed attempts. Please try again later.');
        }

        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = Date.now() + OTP_EXPIRY;
        const otpData: OTPData = {
          code,
          purpose,
          expiresAt,
          metadata: {}
        };

        // Store in Redis
        const otpManager = createOTPManager(redis);
        await otpManager.store(userId, otpData);

        // Store in Prisma for persistence
        await prisma.oTP.create({
          data: {
            code: otpData.code,
            userId,
            expiresAt: new Date(expiresAt), // Convert timestamp to Date for Prisma
            status: OTPStatus.PENDING
          }
        });

        // Send OTP via email
        await sendOTPEmail(email, code, purpose)();

        logger.info(`OTP generated for user ${userId} for ${purpose}`);
        return code;
      },
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const verifyOTP = (
  redis: Redis,
  userId: string,
  code: string,
  purpose: OTPPurpose
): TE.TaskEither<AuthErrors, boolean> =>
  pipe(
    TE.tryCatch(
      async () => {
        // Check if user is blocked
        const isBlocked = await redis.get(getBlockKey(userId));
        if (isBlocked) {
          throw new Error('Too many failed attempts. Please try again later.');
        }

        const otpManager = createOTPManager(redis);
        const result = await otpManager.verify(userId, code);

        if (!result) {
          const attempts = parseInt((await redis.get(getAttemptKey(userId))) || '0', 10) + 1;
          await redis.set(getAttemptKey(userId), attempts.toString(), 'PX', OTP_EXPIRY);

          if (attempts >= MAX_OTP_ATTEMPTS) {
            // Block user for 1 hour
            await redis.set(getBlockKey(userId), '1', 'PX', OTP_BLOCK_DURATION);
            logger.warn(`User ${userId} blocked for too many failed OTP attempts`);
            throw new Error('Too many failed attempts. Please try again later.');
          }

          logger.warn(`Failed OTP attempt for user ${userId}. Attempts: ${attempts}`);
        } else {
          // Update Prisma status
          await prisma.oTP.updateMany({
            where: { 
              userId,
              code,
              status: OTPStatus.PENDING
            },
            data: { 
              status: OTPStatus.USED
            }
          });

          await redis.del(getAttemptKey(userId));
          logger.info(`OTP verified successfully for user ${userId}`);
        }

        return result;
      },
      (error: unknown) =>
        createValidationError(error instanceof Error ? error.message : 'OTP verification failed')
    )
  );

// Helper functions for Prisma operations
const findOTP = (code: string): TE.TaskEither<Error, OTPData> => {
  return () =>
    prisma.oTP.findFirst({
      where: { 
        code,
        status: OTPStatus.PENDING
      }
    }).then(otp => {
      if (!otp) {
        return E.left(new Error('OTP not found'));
      }
      const otpData: OTPData = {
        code: otp.code,
        purpose: 'MFA' as OTPPurpose,
        expiresAt: otp.expiresAt.getTime(),
        metadata: {}
      };
      return E.right(otpData);
    }).catch((_: unknown) => E.left(new Error('Failed to find OTP')));
};

const verifyOTPPurpose = (purpose: OTPPurpose) => 
  (otpData: OTPData): TE.TaskEither<Error, OTPData> => {
    return TE.fromEither(
      otpData.purpose === purpose
        ? E.right(otpData)
        : E.left(new Error('Invalid OTP purpose'))
    );
  };

const verifyOTPExpiration = (otpData: OTPData): TE.TaskEither<Error, boolean> => {
  return TE.fromEither(
    otpData.expiresAt > Date.now()
      ? E.right(true)
      : E.left(new Error('OTP expired'))
  );
};
