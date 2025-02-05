import { PrismaClient, Prisma } from '@eduflow/prisma';
import { createAppError } from '@eduflow/common';
import type { UserAttributes, AppError } from '@eduflow/types';
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

type UserWithIncludes = Prisma.UserGetPayload<{
  include: {
    profile: true;
    documents: true;
  }
}> & {
  roles: Role[];
  permissions: string[];
};

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

// Get user attributes with caching
export const getUserAttributes = async (userId: string): Promise<UserAttributes> => {
  const result = await pipe(
    TE.tryCatch(
      () => redis.get(`${CACHE_PREFIX}${userId}`),
      (error: unknown) => createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get cached user attributes',
        cause: error
      })
    ),
    TE.chain((cached: string | null) => 
      cached 
        ? TE.right(JSON.parse(cached))
        : getUserFromDatabase(userId)
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

const getUserFromDatabase = (userId: string): TaskEither<AppError, UserAttributes> =>
  pipe(
    TE.tryCatch(
      () => prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          documents: true
        }
      }).then(user => user ? {
        ...user,
        roles: user.roles || [],
        permissions: user.permissions || []
      } : null),
      (error: unknown) => createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database query failed',
        cause: error
      })
    ),
    TE.chain((user: UserWithIncludes | null) => 
      user 
        ? TE.right(user)
        : TE.left(createAppError({
            code: 'NOT_FOUND',
            message: 'User not found',
            metadata: { userId }
          }))
    ),
    TE.map(transformToUserAttributes)
  );

const transformToUserAttributes = (user: UserWithIncludes): UserAttributes => ({
  id: user.id,
  email: user.email || '',
  status: user.status,
  globalRoles: user.roles,
  schoolRoles: new Map(),  // This will be populated from a separate query
  kyc: {
    status: user.kycStatus as KYCStatus || KYCStatus.NOT_SUBMITTED,
    verifiedAt: user.kycVerifiedAt || undefined,
    documentIds: user.kycDocumentIds,
    officerStatus: (user.roles.includes('SYSTEM_ADMIN') || user.roles.includes('KYC_OFFICER')) ? {
      isOfficer: true,
      permissions: {
        teacherDocuments: true,
        parentDocuments: true,
        schoolOwnerDocuments: true,
        approvalAuthority: user.roles.includes('SYSTEM_ADMIN'), // Only system admins get full authority
        gracePeriodManagement: user.roles.includes('SYSTEM_ADMIN')
      },
      specializations: ['ALL'],
      workload: 0
    } : undefined
  },
  employment: {
    status: user.employmentStatus as EmploymentEligibilityStatus,
    verifiedAt: user.employmentVerifiedAt || undefined,
    documentIds: user.employmentDocumentIds,
    currentSchools: []  // This will be populated from a separate query
  },
  access: {
    socialEnabled: user.socialAccessEnabled,
    hubAccess: {
      type: 'HUB',
      permissions: user.permissions
    },
    restrictions: {}
  },
  context: {}
});

const cacheUserAttributes = (userId: string, attributes: UserAttributes): TaskEither<AppError, void> =>
  TE.tryCatch(
    async () => {
      await redis.set(
        `${CACHE_PREFIX}${userId}`,
        JSON.stringify(attributes),
        'EX',
        CACHE_TTL
      );
    },
    (error: unknown) => createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to cache user attributes',
      cause: error
    })
  );

// Clear user attributes cache
export const clearUserAttributesCache = (userId: string): TaskEither<AppError, void> =>
  TE.tryCatch(
    async () => {
      await redis.del(`${CACHE_PREFIX}${userId}`);
    },
    (error: unknown) => createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to clear user attributes cache',
      cause: error,
      metadata: { userId }
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
subscribeToEvents().catch(error => {
  logger.error('Failed to subscribe to events:', { error: error instanceof Error ? error.stack : error });
}); 