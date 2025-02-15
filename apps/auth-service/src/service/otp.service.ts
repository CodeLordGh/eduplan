import { Redis } from 'ioredis';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { createOTPManager } from '@eduflow/middleware';
import { AuthErrors, createDatabaseError, createValidationError } from '../errors/auth';
import { sendOTPEmail } from './email.service';
import { createLogger } from '@eduflow/common';
import * as E from 'fp-ts/Either';
import { OTPData, OTPPurpose } from '../domain/types';
import { PrismaClient, OTPStatus } from '@eduflow/prisma';
import { prisma } from '@eduflow/prisma';

export const OTPPurposeEnum: Record<string, OTPPurpose> = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  REGISTRATION: 'REGISTRATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MFA: 'MFA',
  ACCOUNT_LINKING: 'ACCOUNT_LINKING',
  ROLE_DELEGATION: 'ROLE_DELEGATION'
} as const;

const logger = createLogger('otp-service');

const OTP_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_OTP_ATTEMPTS = 3;
const OTP_BLOCK_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const getAttemptKey = (userId: string): string => `otp:attempts:${userId}`;
const getBlockKey = (userId: string): string => `otp:blocked:${userId}`;

const generateCode = (): string => Math.random().toString(36).substring(2, 8).toUpperCase();

const createOTPData = (code: string, purpose: OTPPurpose): OTPData => ({
  code,
  purpose,
  expiresAt: Date.now() + OTP_EXPIRY,
  metadata: {}
});

const storeOTPInRedis = (redis: Redis, userId: string, otpData: OTPData): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      const otpManager = createOTPManager(redis);
      await otpManager.store(userId, otpData);
    },
    (error) => error as Error
  );

const storeOTPInPrisma = (userId: string, otpData: OTPData): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      await prisma.oTP.create({
        data: {
          code: otpData.code,
          userId,
          expiresAt: new Date(otpData.expiresAt),
          status: OTPStatus.PENDING
        }
      });
    },
    (error) => error as Error
  );

const sendOTP = (email: string, code: string, purpose: OTPPurpose): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      await sendOTPEmail(email, code, purpose)();
    },
    (error) => error as Error
  );

const checkUserBlocked = (redis: Redis, userId: string): TE.TaskEither<Error, boolean> =>
  TE.tryCatch(
    async () => {
      const isBlocked = await redis.get(getBlockKey(userId));
      return !!isBlocked;
    },
    (error) => error as Error
  );

export const generateOTP = (
  redis: Redis,
  userId: string,
  email: string,
  purpose: OTPPurpose
): TE.TaskEither<AuthErrors, string> =>
  pipe(
    checkUserBlocked(redis, userId),
    TE.chain((isBlocked) =>
      isBlocked
        ? TE.left(createValidationError('Too many failed attempts. Please try again later.'))
        : TE.right(generateCode())
    ),
    TE.map((code) => createOTPData(code, purpose)),
    TE.chain((otpData) =>
      pipe(
        storeOTPInRedis(redis, userId, otpData),
        TE.chain(() => storeOTPInPrisma(userId, otpData)),
        TE.chain(() => sendOTP(email, otpData.code, purpose)),
        TE.map(() => {
          logger.info(`OTP generated for user ${userId} for ${purpose}`);
          return otpData.code;
        })
      )
    ),
    TE.mapLeft((error) => createDatabaseError(error as Error))
  );

const getAttempts = (redis: Redis, userId: string): TE.TaskEither<Error, number> =>
  TE.tryCatch(
    async () => {
      const attempts = await redis.get(getAttemptKey(userId));
      return parseInt(attempts || '0', 10);
    },
    (error) => error as Error
  );

const incrementAttempts = (redis: Redis, userId: string, attempts: number): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      await redis.set(getAttemptKey(userId), (attempts + 1).toString(), 'PX', OTP_EXPIRY);
    },
    (error) => error as Error
  );

const blockUser = (redis: Redis, userId: string): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
      await redis.set(getBlockKey(userId), '1', 'PX', OTP_BLOCK_DURATION);
      logger.warn(`User ${userId} blocked for too many failed OTP attempts`);
    },
    (error) => error as Error
  );

const verifyOTPCode = (redis: Redis, userId: string, code: string): TE.TaskEither<Error, boolean> =>
  TE.tryCatch(
    async () => {
      const otpManager = createOTPManager(redis);
      return otpManager.verify(userId, code);
    },
    (error) => error as Error
  );

const updateOTPStatus = (userId: string, code: string): TE.TaskEither<Error, void> =>
  TE.tryCatch(
    async () => {
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
    },
    (error) => error as Error
  );

export const verifyOTP = (
  redis: Redis,
  userId: string,
  code: string,
  purpose: OTPPurpose
): TE.TaskEither<AuthErrors, boolean> =>
  pipe(
    checkUserBlocked(redis, userId),
    TE.chain((isBlocked) =>
      isBlocked
        ? TE.left(createValidationError('Too many failed attempts. Please try again later.'))
        : verifyOTPCode(redis, userId, code)
    ),
    TE.chain((isValid) =>
      isValid
        ? pipe(
            updateOTPStatus(userId, code),
            TE.map(() => {
              logger.info(`OTP verified successfully for user ${userId}`);
              return true;
            })
          )
        : pipe(
            getAttempts(redis, userId),
            TE.chain((attempts) =>
              attempts >= MAX_OTP_ATTEMPTS - 1
                ? pipe(
                    blockUser(redis, userId),
                    TE.chain(() =>
                      TE.left(createValidationError('Too many failed attempts. Please try again later.'))
                    )
                  )
                : pipe(
                    incrementAttempts(redis, userId, attempts),
                    TE.map(() => {
                      logger.warn(`Failed OTP attempt for user ${userId}. Attempts: ${attempts + 1}`);
                      return false;
                    })
                  )
            )
          )
    ),
    TE.mapLeft((error) =>
      error instanceof Error
        ? createValidationError(error.message)
        : createValidationError('OTP verification failed')
    )
  );

export { OTPPurpose };
