import * as TE from 'fp-ts/TaskEither';
import { pipe } from 'fp-ts/function';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Role as PrismaRole,
  VerificationStatus,
  EmploymentEligibilityStatus,
  UserStatus,
} from '@eduflow/prisma';
import { FastifyRedis } from '@fastify/redis';
import { hashPassword, verifyPassword, generateJWT } from '@eduflow/common';
import { Role, ROLE_PERMISSIONS } from '@eduflow/types';
import { CreateUserInput, validateCreateUserInput } from '../domain/user';
import {
  AuthErrors,
  createInvalidCredentialsError,
  createUserNotFoundError,
  createDatabaseError,
  createDuplicateEmailError,
  createValidationError,
} from '../errors/auth';
import * as userRepo from '../repository/user.repository';
import * as redisService from './redis.service';
import * as sessionService from './session.service';
import { Credentials, SessionData, AuthError } from '../domain/types';
import { PrismaClient } from '@eduflow/prisma';
import * as E from 'fp-ts/Either';

const prisma = new PrismaClient();

export interface LoginInput {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
  token: string;
}

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

const STAFF_ROLES = [PrismaRole.TEACHER, PrismaRole.SCHOOL_ADMIN, PrismaRole.SCHOOL_HEAD] as const;

const isStaffRole = (roles: Role[]): boolean =>
  roles.some(role => STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]));

export const register = (input: CreateUserInput): TE.TaskEither<AuthErrors, User> =>
  pipe(
    validateCreateUserInput(input),
    TE.chain((validInput) =>
      pipe(
        userRepo.findUserByEmail(validInput.email as string),
        TE.chain((existingUser) =>
          existingUser
            ? TE.left(createDuplicateEmailError())
            : pipe(
                TE.tryCatch(
                  () => hashPassword(validInput.password),
                  (error: unknown) => createDatabaseError(error as Error)
                ),
                TE.chain((hashedPassword) =>
                  userRepo.createUser({
                    email: validInput.email as string,
                    password: hashedPassword,
                    roles: validInput.roles as Role[],
                    phone: validInput.phone as string | undefined
                  })
                )
              )
        )
      )
    )
  );

export const login = (
  redis: FastifyRedis,
  input: LoginInput
): TE.TaskEither<AuthErrors, AuthResult> =>
  pipe(
    userRepo.findUserByEmail(input.email),
    TE.chain((user) =>
      user
        ? pipe(
            TE.tryCatch(
              () => verifyPassword(input.password, user.password),
              (error: unknown) => createDatabaseError(error as Error)
            ),
            TE.chain((isValid) =>
              isValid
                ? pipe(
                    // Check KYC status for roles that require it
                    TE.fromPredicate(
                      (u: User) => {
                        const requiresKYC = isStaffRole(u.roles);
                        return !requiresKYC || u.kycStatus === VerificationStatus.VERIFIED;
                      },
                      () => createValidationError('KYC verification required for this role')
                    )(user),
                    TE.chain(() =>
                      // Check employment eligibility for staff roles
                      TE.fromPredicate(
                        (u: User) => {
                          const requiresEmploymentCheck = isStaffRole(u.roles);
                          return (
                            !requiresEmploymentCheck ||
                            u.employmentStatus === EmploymentEligibilityStatus.ELIGIBLE
                          );
                        },
                        () =>
                          createValidationError(
                            'Employment eligibility check required for this role'
                          )
                      )(user)
                    ),
                    TE.chain(() => generateAuthTokens(redis, user)),
                    TE.chain((tokens) =>
                      pipe(
                        sessionService.createSession(
                          redis,
                          user.id,
                          user.email || '',
                          user.roles,
                          input.ipAddress,
                          input.userAgent
                        ),
                        TE.map(() => ({
                          user,
                          ...tokens,
                        }))
                      )
                    )
                  )
                : TE.left(createInvalidCredentialsError())
            )
          )
        : TE.left(createUserNotFoundError())
    )
  );

export const refresh = (
  redis: FastifyRedis,
  refreshToken: string,
  ipAddress: string,
  userAgent: string
): TE.TaskEither<AuthErrors, AuthResult> =>
  pipe(
    redisService.getRefreshTokenUserId(redis, refreshToken),
    TE.chain((optionUserId) =>
      optionUserId._tag === 'Some'
        ? pipe(
            userRepo.findUserById(optionUserId.value),
            TE.chain((user) =>
              user
                ? pipe(
                    // Check KYC status for roles that require it
                    TE.fromPredicate(
                      (u: User) => {
                        const requiresKYC = isStaffRole(u.roles);
                        return !requiresKYC || u.kycStatus === VerificationStatus.VERIFIED;
                      },
                      () => createValidationError('KYC verification required for this role')
                    )(user),
                    TE.chain(() =>
                      // Check employment eligibility for staff roles
                      TE.fromPredicate(
                        (u: User) => {
                          const requiresEmploymentCheck = isStaffRole(u.roles);
                          return (
                            !requiresEmploymentCheck ||
                            u.employmentStatus === EmploymentEligibilityStatus.ELIGIBLE
                          );
                        },
                        () =>
                          createValidationError(
                            'Employment eligibility check required for this role'
                          )
                      )(user)
                    ),
                    TE.chain(() => generateAuthTokens(redis, user)),
                    TE.chain((tokens) =>
                      pipe(
                        sessionService.updateSession(redis, user.id, {
                          lastActivity: Date.now(),
                          ipAddress,
                          userAgent,
                        }),
                        TE.map(() => ({ ...tokens, user }))
                      )
                    )
                  )
                : TE.left(createUserNotFoundError())
            )
          )
        : TE.left(createInvalidCredentialsError())
    )
  );

export const logout = (
  redis: FastifyRedis,
  refreshToken: string
): TE.TaskEither<AuthErrors, void> =>
  pipe(
    redisService.getRefreshTokenUserId(redis, refreshToken),
    TE.chain((optionUserId) =>
      optionUserId._tag === 'Some'
        ? pipe(
            redisService.deleteRefreshToken(redis, refreshToken),
            TE.chain(() => sessionService.deleteSession(redis, optionUserId.value))
          )
        : TE.left(createInvalidCredentialsError())
    )
  );

const generateAuthTokens = (
  redis: FastifyRedis,
  user: User
): TE.TaskEither<AuthErrors, { accessToken: string; refreshToken: string }> =>
  pipe(
    TE.tryCatch(
      async () => {
        if (!user.email) {
          throw new Error('User email is required for token generation');
        }
        const accessToken = generateJWT({
          userId: user.id,
          email: user.email,
          roles: user.roles,
          permissions: user.roles.flatMap(role => ROLE_PERMISSIONS[role as Role] || []),
          kycVerified: user.kycStatus === VerificationStatus.VERIFIED,
          employmentEligible: user.employmentStatus === EmploymentEligibilityStatus.ELIGIBLE,
          socialAccessEnabled: user.socialAccessEnabled || false,
        });
        const refreshToken = uuidv4();

        await redisService.storeRefreshToken(redis, user.id, refreshToken, REFRESH_TOKEN_EXPIRY);

        return { accessToken, refreshToken };
      },
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

const validateCredentials = (
  credentials: Credentials
): TE.TaskEither<AuthError, string> => {
  return () => 
    prisma.user.findUnique({
      where: { email: credentials.email }
    }).then(user => {
      if (!user) {
        return E.left<AuthError, string>({ _tag: 'InvalidCredentials' })
      }
      // Password validation would go here
      return E.right(user.id)
    }).catch(() => E.left<AuthError, string>({ _tag: 'InvalidCredentials' }))
}

const verifyMFAIfEnabled = (
  userId: string
): TE.TaskEither<AuthError, string> => {
  return () =>
    prisma.user.findUnique({
      where: { id: userId }
    }).then(user => {
      // For now, we'll assume MFA is not required
      // This should be implemented based on your MFA requirements
      return E.right(userId)
    }).catch(() => E.left({ _tag: 'InvalidCredentials' }))
}

const createSession = (
  userId: string
): TE.TaskEither<AuthError, SessionData> => {
  const session: SessionData = {
    id: uuidv4(),
    userId,
    deviceInfo: 'default',
    ipAddress: '127.0.0.1',
    lastActive: new Date(),
    mfaVerified: false
  }
  return TE.right(session)
}

export const authenticate = (
  credentials: Credentials
): TE.TaskEither<AuthError, SessionData> =>
  pipe(
    validateCredentials(credentials),
    TE.chain(verifyMFAIfEnabled),
    TE.chain(createSession)
  )

export const refreshSession = (
  sessionId: string
): TE.TaskEither<AuthError, SessionData> => {
  const session: SessionData = {
    id: sessionId,
    userId: '', // This should be fetched from Redis in a real implementation
    deviceInfo: 'default',
    ipAddress: '127.0.0.1',
    lastActive: new Date(),
    mfaVerified: false
  }
  return TE.right(session)
}
