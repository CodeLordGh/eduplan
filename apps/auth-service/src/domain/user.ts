import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Prisma, Role, UserStatus, VerificationStatus, User as PrismaUser } from '@eduflow/prisma';
import { validateEmail, validatePassword } from '@eduflow/common';
import { createValidationError, createDuplicateEmailError, AuthErrors } from '../errors/auth';

export type User = PrismaUser;

export type CreateUserInput = Omit<Prisma.UserCreateInput, 'status'> & {
  email: string;
  password: string;
  role: Role;
};

export type UpdateUserInput = Prisma.UserUpdateInput;

export type AuthResult = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export const validateCreateUserInput = (
  input: CreateUserInput
): TE.TaskEither<AuthErrors, Prisma.UserCreateInput> =>
  TE.tryCatch(
    async () => {
      await validateEmail(input.email);
      await validatePassword(input.password);
      return {
        ...input,
        status: UserStatus.PENDING,
      };
    },
    () => createValidationError('Invalid input')
  );

export const validateUpdateUserInput = (
  input: UpdateUserInput
): TE.TaskEither<AuthErrors, UpdateUserInput> =>
  TE.tryCatch(
    async () => {
      if (typeof input.email === 'string') await validateEmail(input.email);
      if (typeof input.password === 'string') await validatePassword(input.password);
      return input;
    },
    () => createValidationError('Invalid input')
  );
