import { PrismaClient, Prisma } from '@eduflow/prisma';
import { createAppError } from '@eduflow/common';
import { transformToUserAttributes, UserWithIncludes, RequestContext } from '@eduflow/common';
import type { UserAttributes, AppError, UserContext } from '@eduflow/types';
import { KYCStatus, EmploymentEligibilityStatus, Role } from '@eduflow/types';
import { redis } from '../config/redis';
import { pipe } from 'fp-ts/function';
import { TaskEither } from 'fp-ts/TaskEither';
import * as TE from 'fp-ts/TaskEither';
import { logger } from '../config/logger';

const CACHE_TTL = 5 * 60; // 5 minutes
const CACHE_PREFIX = 'user_attributes:';

// Initialize Prisma client
const prisma = new PrismaClient();

interface StaffAssignment {
  school: {
    id: string;
  };
  role: string;
  permissions: string[];
  communicationPermissions: string[];
  assignedBy: string;
  createdAt: Date;
}

// ABAC-specific interfaces
interface KYCAttributes {
  status: KYCStatus;
  verifiedAt?: Date;
  documentIds: string[];
  officerStatus?: {
    permissions: {
      canVerifyIdentity: boolean;
      canVerifyDocuments: boolean;
      canApproveKYC: boolean;
    };
  };
}

interface EmploymentAttributes {
  status: EmploymentEligibilityStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  documentIds: string[];
  currentSchools: string[];
}

interface AccessAttributes {
  failedAttempts: number;
  lastLogin?: Date;
  lockedUntil?: Date;
  socialEnabled: boolean;
  restrictions: {
    ipWhitelist?: string[];
    allowedCountries?: string[];
    timeRestrictions?: {
      allowedDays: string[];
      allowedHours: string[];
      timezone: string;
    };
  };
}

// Transform functions for each ABAC component
const transformKYCAttributes = (user: UserWithIncludes): KYCAttributes => ({
  status: (user.kycStatus || KYCStatus.NOT_STARTED) as KYCStatus,
  verifiedAt: user.kycVerifiedAt || undefined,
  documentIds: user.kycDocumentIds || [],
  officerStatus: user.roles.includes('KYC_OFFICER')
    ? {
        permissions: {
          canVerifyIdentity: true,
          canVerifyDocuments: true,
          canApproveKYC: user.roles.includes('SYSTEM_ADMIN'),
        },
      }
    : undefined,
});

const transformEmploymentAttributes = (user: UserWithIncludes): EmploymentAttributes => ({
  status: (user.employmentStatus ||
    EmploymentEligibilityStatus.UNVERIFIED) as EmploymentEligibilityStatus,
  verifiedAt: user.employmentVerifiedAt || undefined,
  verifiedBy: user.verifications?.[0]?.id,
  documentIds: user.employmentDocumentIds || [],
  currentSchools: [], // Will be populated by school service
});

const transformAccessAttributes = async (userId: string): Promise<AccessAttributes> => {
  // Get access data from auth service
  const accessData = await getAccessFromAuthService(userId);

  return {
    failedAttempts: accessData.failedAttempts || 0,
    lastLogin: accessData.lastLogin,
    lockedUntil: accessData.lockedUntil,
    socialEnabled: accessData.socialEnabled || false,
    restrictions: {
      ipWhitelist: accessData.ipWhitelist,
      allowedCountries: accessData.allowedCountries,
      timeRestrictions: accessData.timeRestrictions,
    },
  };
};

const transformContextAttributes = async (
  user: UserWithIncludes,
  requestContext?: RequestContext
): Promise<UserContext> => ({
  currentSchoolId: await getCurrentSchoolId(user.id),
  location: requestContext?.location,
  deviceInfo: requestContext?.deviceInfo
    ? {
        id: requestContext.deviceInfo.id,
        type: requestContext.deviceInfo.type,
        trustScore: requestContext.deviceInfo.trustScore || 0,
        lastVerified: requestContext.deviceInfo.lastVerified || new Date(),
      }
    : undefined,
});

// Helper functions for external service calls
const getAccessFromAuthService = async (userId: string): Promise<any> => {
  // TODO: Implement auth service call
  return {};
};

const getCurrentSchoolId = async (userId: string): Promise<string | undefined> => {
  // TODO: Implement school service call
  return undefined;
};

const getSchoolRoles = async (userId: string): Promise<Record<string, Role[]>> => {
  // TODO: Implement school service call
  return {};
};

// Update the main function to handle request context
export const getUserAttributes = async (
  userId: string,
  requestContext?: RequestContext
): Promise<UserAttributes> => {
  const result = await pipe(
    TE.tryCatch(
      () => redis.get(`${CACHE_PREFIX}${userId}`),
      (error: unknown) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get cached user attributes',
          cause: error,
        })
    ),
    TE.chain((cached: string | null) =>
      cached ? TE.right(JSON.parse(cached)) : getUserFromDatabase(userId, requestContext)
    ),
    TE.chain((attributes: UserAttributes) =>
      pipe(
        cacheUserAttributes(userId, attributes),
        TE.map(() => attributes)
      )
    )
  )();

  if (result._tag === 'Left') {
    throw result.left;
  }

  return result.right;
};

// Update database query function
const getUserFromDatabase = (
  userId: string,
  requestContext?: RequestContext
): TaskEither<AppError, UserAttributes> =>
  pipe(
    TE.tryCatch(
      () =>
        prisma.user
          .findUnique({
            where: { id: userId },
            include: {
              profile: true,
              documents: true,
              verifications: true,
            },
          })
          .then(async (user) => {
            if (!user) return null;
            const userWithRoles = {
              ...user,
              roles: user.roles || [],
              permissions: user.permissions || [],
            };
            return transformToUserAttributes(userWithRoles, {
              requestContext,
              getAccessData: getAccessFromAuthService,
              getCurrentSchoolId,
              getSchoolRoles,
            });
          }),
      (error: unknown) =>
        createAppError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database query failed',
          cause: error,
        })
    ),
    TE.chain((user: UserAttributes | null) =>
      user
        ? TE.right(user)
        : TE.left(
            createAppError({
              code: 'NOT_FOUND',
              message: 'User not found',
              metadata: { userId },
            })
          )
    )
  );

const cacheUserAttributes = (
  userId: string,
  attributes: UserAttributes
): TaskEither<AppError, void> =>
  TE.tryCatch(
    async () => {
      await redis.set(`${CACHE_PREFIX}${userId}`, JSON.stringify(attributes), 'EX', CACHE_TTL);
    },
    (error: unknown) =>
      createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cache user attributes',
        cause: error,
      })
  );

// Clear user attributes cache
export const clearUserAttributesCache = (userId: string): TaskEither<AppError, void> =>
  TE.tryCatch(
    async () => {
      await redis.del(`${CACHE_PREFIX}${userId}`);
    },
    (error: unknown) =>
      createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clear user attributes cache',
        cause: error,
        metadata: { userId },
      })
  );

// Subscribe to user-related events to invalidate cache
const subscribeToEvents = async (): Promise<void> => {
  const subscriber = redis.duplicate();

  await subscriber.subscribe('user_events', 'kyc_events', 'school_events');

  subscriber.on('message', async (channel, message) => {
    const event = JSON.parse(message);

    if (event.userId) {
      await clearUserAttributesCache(event.userId)();
    }
  });
};

// Initialize event subscription
subscribeToEvents().catch((error) => {
  logger.error('Failed to subscribe to events:', {
    error: error instanceof Error ? error.stack : error,
  });
});
