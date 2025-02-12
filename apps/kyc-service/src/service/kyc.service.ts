import { DocumentType, VerificationStatus, EntityType, PrismaClient } from '@eduflow/prisma';
import { EVENT_TYPES } from '@eduflow/constants';
import { Redis } from 'ioredis';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { KYCError } from '../errors/kyc.error';

type Dependencies = {
  prisma: PrismaClient;
  redis: Redis;
};

const subscribeToEvents = (deps: Dependencies) => {
  const subscriber = deps.redis.duplicate();
  const eventSubscriptions = ['auth_events', 'school_events', 'user_events', 'file_events'];

  subscriber.subscribe(...eventSubscriptions);

  subscriber.on('message', async (channel, message) => {
    const event = JSON.parse(message);

    switch (event.type) {
      case EVENT_TYPES.USER_CREATED:
        await handleUserCreated(deps)(event.payload);
        break;
      case EVENT_TYPES.SCHOOL_CREATED:
        await handleSchoolCreated(deps)(event.payload);
        break;
      case EVENT_TYPES.STAFF_ASSIGNED:
        await handleStaffAssigned(deps)(event.payload);
        break;
      case EVENT_TYPES.PROFILE_UPDATED:
        await handleProfileUpdated(deps)(event.payload);
        break;
      case EVENT_TYPES.SCHOOL_UPDATED:
        await handleSchoolUpdated(deps)(event.payload);
        break;
      case EVENT_TYPES.FILE_UPLOADED:
        await handleFileUploaded(deps)(event.payload);
        break;
    }
  });
};

const handleUserCreated =
  (deps: Dependencies) =>
  async (payload: any): Promise<void> => {
    await deps.prisma.user.update({
      where: { id: payload.userId },
      data: {
        kycStatus: VerificationStatus.PENDING,
        kycDocumentIds: [],
      },
    });
  };

const handleSchoolCreated =
  (deps: Dependencies) =>
  async (payload: any): Promise<void> => {
    await deps.prisma.verificationHistory.create({
      data: {
        entityId: payload.schoolId,
        entityType: EntityType.SCHOOL,
        status: VerificationStatus.PENDING,
        notes: 'School verification initialized',
      },
    });
  };

const handleStaffAssigned =
  (deps: Dependencies) =>
  async (payload: any): Promise<void> => {
    await deps.prisma.kYCDocument.updateMany({
      where: { userId: payload.userId },
      data: {
        metadata: {
          schoolId: payload.schoolId,
          role: payload.role,
        },
      },
    });
  };

const handleProfileUpdated =
  (deps: Dependencies) =>
  async (payload: any): Promise<void> => {
    if (payload.criticalFieldsChanged) {
      await deps.prisma.user.update({
        where: { id: payload.userId },
        data: {
          kycStatus: VerificationStatus.PENDING,
          kycVerifiedAt: null,
        },
      });
    }
  };

const handleSchoolUpdated =
  (deps: Dependencies) =>
  async (payload: any): Promise<void> => {
    if (payload.criticalFieldsChanged) {
      await deps.prisma.verificationHistory.create({
        data: {
          entityId: payload.schoolId,
          entityType: EntityType.SCHOOL,
          status: VerificationStatus.PENDING,
          notes: 'Re-verification required due to critical updates',
        },
      });
    }
  };

const handleFileUploaded =
  (deps: Dependencies) =>
  async (payload: any): Promise<void> => {
    if (payload.context === 'KYC') {
      await deps.prisma.kYCDocument.update({
        where: { id: payload.documentId },
        data: {
          documentUrls: {
            push: payload.fileUrl,
          },
        },
      });
    }
  };

const publishEvent =
  (deps: Dependencies) =>
  async (eventType: string, payload: Record<string, unknown>): Promise<void> => {
    await deps.redis.publish(
      'kyc_events',
      JSON.stringify({
        type: eventType,
        payload,
        timestamp: new Date(),
      })
    );
  };

export const submitDocument =
  (deps: Dependencies) =>
  (
    userId: string,
    type: DocumentType,
    documentUrls: string[],
    metadata: Record<string, unknown>
  ): TE.TaskEither<KYCError, any> =>
    pipe(
      TE.tryCatch(
        async () => {
          const document = await deps.prisma.kYCDocument.create({
            data: {
              userId,
              type,
              status: VerificationStatus.PENDING,
              documentUrls,
              metadata: metadata as any,
            },
          });

          await publishEvent(deps)(EVENT_TYPES.KYC_SUBMITTED, {
            userId,
            documentId: document.id,
            type,
            status: VerificationStatus.PENDING,
            timestamp: new Date(),
          });

          return document;
        },
        (error) => new KYCError('Failed to submit document', error)
      )
    );

export const verifyDocument =
  (deps: Dependencies) =>
  (
    documentId: string,
    status: VerificationStatus,
    verifiedBy: string,
    notes?: string
  ): TE.TaskEither<KYCError, any> =>
    pipe(
      TE.tryCatch(
        async () => {
          const document = await deps.prisma.kYCDocument.update({
            where: { id: documentId },
            data: {
              status,
              verifiedAt: new Date(),
            },
          });

          await deps.prisma.verificationHistory.create({
            data: {
              entityId: document.userId,
              entityType: EntityType.USER,
              status,
              verifiedBy,
              notes,
            },
          });

          await publishEvent(deps)(
            status === VerificationStatus.VERIFIED
              ? EVENT_TYPES.KYC_VERIFIED
              : EVENT_TYPES.KYC_REJECTED,
            {
              userId: document.userId,
              documentId,
              type: document.type,
              status,
              verifiedBy,
              timestamp: new Date(),
            }
          );

          return document;
        },
        (error) => new KYCError('Failed to verify document', error)
      )
    );

export const getDocumentsByUser =
  (deps: Dependencies) =>
  (userId: string): TE.TaskEither<KYCError, any[]> =>
    pipe(
      TE.tryCatch(
        () =>
          deps.prisma.kYCDocument.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
          }),
        (error) => new KYCError('Failed to get user documents', error)
      )
    );

export const getVerificationHistory =
  (deps: Dependencies) =>
  (entityId: string): TE.TaskEither<KYCError, any[]> =>
    pipe(
      TE.tryCatch(
        () =>
          deps.prisma.verificationHistory.findMany({
            where: { entityId },
            orderBy: { createdAt: 'desc' },
          }),
        (error) => new KYCError('Failed to get verification history', error)
      )
    );

export const createKYCService = (deps: Dependencies) => {
  subscribeToEvents(deps);

  return {
    submitDocument: submitDocument(deps),
    verifyDocument: verifyDocument(deps),
    getDocumentsByUser: getDocumentsByUser(deps),
    getVerificationHistory: getVerificationHistory(deps),
  };
};
