import { Redis } from 'ioredis';
import { EVENT_TYPES } from '@eduflow/types';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { AuthError } from '../errors/auth.error';
import { PrismaClient, VerificationStatus } from '@eduflow/prisma';

type Dependencies = {
  redis: Redis;
  prisma: PrismaClient;
};

type EventType = keyof typeof EVENT_TYPES;

const publishEvent =
  (deps: Dependencies) =>
  async (eventType: EventType, payload: Record<string, unknown>): Promise<void> => {
    await deps.redis.publish(
      'auth_events',
      JSON.stringify({
        type: EVENT_TYPES[eventType],
        payload,
        timestamp: new Date(),
      })
    );
  };

export const handleKYCVerified =
  (deps: Dependencies) =>
  async (event: { userId: string; status: string; type: string }): Promise<void> => {
    await pipe(
      TE.tryCatch(
        async () => {
          await deps.prisma.user.update({
            where: { id: event.userId },
            data: {
              kycStatus: VerificationStatus.VERIFIED,
              kycVerifiedAt: new Date(),
              socialAccessEnabled: true,
            },
          });

          await publishEvent(deps)('USER_UPDATED', {
            userId: event.userId,
            kycStatus: VerificationStatus.VERIFIED,
            timestamp: new Date(),
          });
        },
        (error) => new AuthError('Failed to handle KYC verified event', error)
      )
    )();
  };

export const handleKYCRejected =
  (deps: Dependencies) =>
  async (event: { userId: string; status: string; type: string }): Promise<void> => {
    await pipe(
      TE.tryCatch(
        async () => {
          await deps.prisma.user.update({
            where: { id: event.userId },
            data: {
              kycStatus: VerificationStatus.REJECTED,
              kycVerifiedAt: null,
              socialAccessEnabled: false,
            },
          });

          await publishEvent(deps)('USER_UPDATED', {
            userId: event.userId,
            kycStatus: VerificationStatus.REJECTED,
            timestamp: new Date(),
          });
        },
        (error) => new AuthError('Failed to handle KYC rejected event', error)
      )
    )();
  };

export const createEventService = (deps: Dependencies) => ({
  handleKYCVerified: handleKYCVerified(deps),
  handleKYCRejected: handleKYCRejected(deps),
});
