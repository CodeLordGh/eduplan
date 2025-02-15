import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Prisma, Role, UserStatus, VerificationStatus, User as PrismaUser } from '@eduflow/prisma';
import { validateEmail, validatePassword } from '@eduflow/common';
import { createValidationError, createDuplicateEmailError, AuthErrors } from '../errors/auth';
import { PrismaClient } from '@eduflow/prisma';

const prisma = new PrismaClient();

const validatePhoneNumber = (phone: string): void => {
  // Remove any spaces, hyphens, or parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it starts with + for international format
  if (!cleanPhone.startsWith('+')) {
    throw createValidationError('Phone number must include country code starting with +');
  }
  
  // Remove the plus sign for length check
  const digits = cleanPhone.slice(1);
  
  // Check if remaining characters are all digits
  if (!/^\d+$/.test(digits)) {
    throw createValidationError('Phone number must contain only digits after country code');
  }
  
  // Check length (international numbers can be between 10 and 14 digits)
  if (digits.length < 10 || digits.length > 14) {
    throw createValidationError('Phone number must be between 10 and 14 digits');
  }
};

export type User = PrismaUser;

export type CreateUserInput = Omit<Prisma.UserCreateInput, 'status'> & {
  email: string;
  password: string;
  role: Role;
  phone?: string;
};

export type UpdateUserInput = Prisma.UserUpdateInput & {
  phone?: string;
};

export type AuthResult = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

const checkDuplicateEmail = async (email: string): Promise<void> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existingUser) {
    throw createDuplicateEmailError();
  }
};

const checkDuplicatePhone = async (phone: string): Promise<void> => {
  const existingUser = await prisma.user.findFirst({
    where: { phone },
    select: { id: true }
  });
  if (existingUser) {
    throw createValidationError('Phone number already registered');
  }
};

export const validateCreateUserInput = (
  input: CreateUserInput
): TE.TaskEither<AuthErrors, Prisma.UserCreateInput> =>
  TE.tryCatch(
    async () => {
      // Format validation
      await validateEmail(input.email);
      await validatePassword(input.password);
      
      // Phone validation
      if (input.phone) {
        validatePhoneNumber(input.phone);
        await checkDuplicatePhone(input.phone);
      }
      
      // Duplicate checks
      await checkDuplicateEmail(input.email);

      return {
        ...input,
        status: UserStatus.PENDING,
      };
    },
    (error: unknown) => {
      if (error instanceof Error && 'code' in error) {
        return error as AuthErrors;
      }
      return createValidationError('Invalid input');
    }
  );

export const validateUpdateUserInput = (
  input: UpdateUserInput,
  currentUser?: User
): TE.TaskEither<AuthErrors, UpdateUserInput> =>
  TE.tryCatch(
    async () => {
      if (typeof input.email === 'string') {
        await validateEmail(input.email);
        // Only check duplicate if email is different from current
        if (currentUser && input.email !== currentUser.email) {
          await checkDuplicateEmail(input.email);
        }
      }
      if (input.phone) {
        validatePhoneNumber(input.phone);
        if (currentUser?.phone !== input.phone) {
          await checkDuplicatePhone(input.phone);
        }
      }
      if (typeof input.password === 'string') {
        await validatePassword(input.password);
      }
      return input;
    },
    (error: unknown) => {
      if (error instanceof Error && 'code' in error) {
        return error as AuthErrors;
      }
      return createValidationError('Invalid input');
    }
  );
