import { FastifyRedis } from '@fastify/redis';
import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { Role } from '@eduflow/prisma';
import { Permission, ROLE_PERMISSIONS } from '@eduflow/types';
import { createLogger } from '@eduflow/common';
import { AuthErrors, createDatabaseError, createValidationError } from '../errors/auth';

const logger = createLogger('session-service');

export interface SessionData {
  userId: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

const SESSION_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
const SESSION_PREFIX = 'session:';

const createSessionKey = (userId: string) => `${SESSION_PREFIX}${userId}`;

export const createSession = (
  redis: FastifyRedis,
  userId: string,
  email: string,
  roles: Role[],
  ipAddress: string,
  userAgent: string
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const sessionData: SessionData = {
          userId,
          email,
          roles,
          permissions: roles.flatMap(role => ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]),
          lastActivity: Date.now(),
          ipAddress,
          userAgent,
        };

        await redis.set(
          createSessionKey(userId),
          JSON.stringify(sessionData),
          'EX',
          SESSION_EXPIRY
        );

        logger.info(`Session created for user ${userId}`);
      },
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const getSession = (
  redis: FastifyRedis,
  userId: string
): TE.TaskEither<AuthErrors, SessionData> =>
  pipe(
    TE.tryCatch(
      async () => {
        const data = await redis.get(createSessionKey(userId));
        if (!data) {
          throw new Error('Session not found');
        }

        const session = JSON.parse(data) as SessionData;

        // Update last activity
        session.lastActivity = Date.now();
        await redis.set(createSessionKey(userId), JSON.stringify(session), 'EX', SESSION_EXPIRY);

        return session;
      },
      (error: unknown) => createValidationError('Invalid or expired session')
    )
  );

export const updateSession = (
  redis: FastifyRedis,
  userId: string,
  updates: Partial<SessionData>
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        const data = await redis.get(createSessionKey(userId));
        if (!data) {
          throw new Error('Session not found');
        }

        const session = JSON.parse(data) as SessionData;
        const updatedSession = {
          ...session,
          ...updates,
          lastActivity: Date.now(),
        };

        await redis.set(
          createSessionKey(userId),
          JSON.stringify(updatedSession),
          'EX',
          SESSION_EXPIRY
        );

        logger.info(`Session updated for user ${userId}`);
      },
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const deleteSession = (
  redis: FastifyRedis,
  userId: string
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    TE.tryCatch(
      async () => {
        await redis.del(createSessionKey(userId));
        logger.info(`Session deleted for user ${userId}`);
      },
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const validateSession = (
  redis: FastifyRedis,
  userId: string,
  requiredPermissions?: Permission[]
): TE.TaskEither<AuthErrors, boolean> =>
  pipe(
    TE.tryCatch(
      async () => {
        const data = await redis.get(createSessionKey(userId));
        if (!data) {
          return false;
        }

        const session = JSON.parse(data) as SessionData;

        if (!requiredPermissions || requiredPermissions.length === 0) {
          return true;
        }

        return requiredPermissions.every((permission) => session.permissions.includes(permission));
      },
      (error: unknown) => createDatabaseError(error as Error)
    )
  );
