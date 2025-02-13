import {
  PrismaClient,
  Role,
  UserStatus,
  VerificationStatus,
  User as PrismaUser,
} from '@eduflow/prisma';
import * as TE from 'fp-ts/TaskEither';
import { CreateUserInput, UpdateUserInput } from '../domain/user';
import { AuthErrors, createDatabaseError } from '../errors/auth';

type User = PrismaUser;

const prisma = new PrismaClient();

export const findUserByEmail = (email: string): TE.TaskEither<AuthErrors, User | null> =>
  TE.tryCatch(
    async () => prisma.user.findUnique({ where: { email } }),
    (error: unknown) => createDatabaseError(error as Error)
  );

export const createUser = (input: CreateUserInput): TE.TaskEither<AuthErrors, User> =>
  TE.tryCatch(
    async () => {
      const user = await prisma.user.create({
        data: {
          ...input,
          status: 'PENDING',
        },
      });
      return {
        ...user,
        role: user.role as Role,
        status: user.status as UserStatus,
      };
    },
    (error: unknown) => createDatabaseError(error as Error)
  );

export const updateUser = (id: string, input: UpdateUserInput): TE.TaskEither<AuthErrors, User> =>
  TE.tryCatch(
    async () => {
      const user = await prisma.user.update({
        where: { id },
        data: input,
      });
      return {
        ...user,
        role: user.role as Role,
        status: user.status as UserStatus,
      };
    },
    (error: unknown) => createDatabaseError(error as Error)
  );

export const findUserById = (id: string): TE.TaskEither<AuthErrors, User | null> =>
  TE.tryCatch(
    async () => {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return {
        ...user,
        role: user.role as Role,
        status: user.status as UserStatus,
      };
    },
    (error: unknown) => createDatabaseError(error as Error)
  );

export const deleteUser = (id: string): TE.TaskEither<AuthErrors, User> =>
  TE.tryCatch(
    async () => {
      const user = await prisma.user.delete({ where: { id } });
      return {
        ...user,
        role: user.role as Role,
        status: user.status as UserStatus,
      };
    },
    (error: unknown) => createDatabaseError(error as Error)
  );
