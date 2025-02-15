import {
  PrismaClient,
  Role,
  UserStatus,
  VerificationStatus,
  User as PrismaUser,
} from '@eduflow/prisma';
import * as TE from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { pipe } from 'fp-ts/function';
import { CreateUserInput, UpdateUserInput } from '../domain/user';
import { AuthErrors, createDatabaseError } from '../errors/auth';
import { prisma } from '@eduflow/prisma';

type User = PrismaUser;

const findUserByEmailQuery = (email: string) => prisma.user.findUnique({ where: { email } });
const findUserByIdQuery = (id: string) => prisma.user.findUnique({ where: { id } });
const createUserQuery = (input: CreateUserInput) =>
  prisma.user.create({
    data: {
      ...input,
      status: 'PENDING',
    },
  });
const updateUserQuery = (id: string, input: UpdateUserInput) =>
  prisma.user.update({
    where: { id },
    data: input,
  });
const deleteUserQuery = (id: string) => prisma.user.delete({ where: { id } });

export const findUserByEmail = (email: string): TE.TaskEither<AuthErrors, User | null> =>
  pipe(
    TE.tryCatch(
      () => findUserByEmailQuery(email),
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const createUser = (input: CreateUserInput): TE.TaskEither<AuthErrors, User> =>
  pipe(
    TE.tryCatch(
      () => createUserQuery(input),
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const updateUser = (id: string, input: UpdateUserInput): TE.TaskEither<AuthErrors, User> =>
  pipe(
    TE.tryCatch(
      () => updateUserQuery(id, input),
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const findUserById = (id: string): TE.TaskEither<AuthErrors, User | null> =>
  pipe(
    TE.tryCatch(
      () => findUserByIdQuery(id),
      (error: unknown) => createDatabaseError(error as Error)
    )
  );

export const deleteUser = (id: string): TE.TaskEither<AuthErrors, User> =>
  pipe(
    TE.tryCatch(
      () => deleteUserQuery(id),
      (error: unknown) => createDatabaseError(error as Error)
    )
  );
