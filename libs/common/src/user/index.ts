import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { TaskEither } from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
import { validateEmail, validatePassword } from '../validation';
import { User, CreateUserInput, UpdateUserInput, UserRepository } from './types';
import { hashPassword, verifyPassword } from '../security';
import { createAppError } from '../errors';
import { AppError } from '@eduflow/types';

// Validation functions
const validateCreateUserInput = (input: CreateUserInput): TaskEither<AppError, CreateUserInput> =>
  TE.tryCatch(
    async () => {
      if (!validateEmail(input.email)) {
        throw createAppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        });
      }
      if (!validatePassword(input.password)) {
        throw createAppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid password format'
        });
      }
      return input;
    },
    error => createAppError({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      cause: error
    })
  );

const validateUpdateUserInput = (input: UpdateUserInput): TaskEither<AppError, UpdateUserInput> =>
  TE.tryCatch(
    async () => {
      if (input.email && !validateEmail(input.email)) {
        throw createAppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format'
        });
      }
      if (input.password && !validatePassword(input.password)) {
        throw createAppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid password format'
        });
      }
      return input;
    },
    error => createAppError({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      cause: error
    })
  );

// User service factory
export const createUserService = (repository: UserRepository) => {
  const findByEmail = (email: string): TaskEither<AppError, Option<User>> =>
    TE.tryCatch(
      async () => O.fromNullable(await repository.findByEmail(email)),
      error => createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database error',
        cause: error
      })
    );

  const findById = (id: string): TaskEither<AppError, Option<User>> =>
    TE.tryCatch(
      async () => O.fromNullable(await repository.findById(id)),
      error => createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database error',
        cause: error
      })
    );

  const create = (input: CreateUserInput): TaskEither<AppError, User> =>
    pipe(
      input,
      validateCreateUserInput,
      TE.chain(() => findByEmail(input.email)),
      TE.chain((existingUser: Option<User>) => {
        if (existingUser._tag === 'Some') {
          return TE.left(createAppError({
            code: 'CONFLICT',
            message: `User with email ${input.email} already exists`
          }));
        }
        return TE.right(input);
      }),
      TE.chain((validInput: CreateUserInput) =>
        TE.tryCatch(
          async () => {
            const hashedPassword = await hashPassword(validInput.password);
            return repository.create({
              ...validInput,
              password: hashedPassword
            });
          },
          error => createAppError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create user',
            cause: error
          })
        )
      )
    );

  const update = (id: string, input: UpdateUserInput): TaskEither<AppError, User> =>
    pipe(
      input,
      validateUpdateUserInput,
      TE.chain(() => findById(id)),
      TE.chain((existingUser: Option<User>) => {
        if (existingUser._tag === 'None') {
          return TE.left(createAppError({
            code: 'NOT_FOUND',
            message: 'User not found'
          }));
        }
        return TE.right({ existingUser: existingUser.value, input });
      }),
      TE.chain(({ existingUser, input }) =>
        TE.tryCatch(
          async () => {
            const updates = { ...input };
            if (input.password) {
              updates.password = await hashPassword(input.password);
            }
            return repository.update(id, updates);
          },
          error => createAppError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update user',
            cause: error
          })
        )
      )
    );

  const remove = (id: string): TaskEither<AppError, void> =>
    pipe(
      findById(id),
      TE.chain((existingUser: Option<User>) => {
        if (existingUser._tag === 'None') {
          return TE.left(createAppError({
            code: 'NOT_FOUND',
            message: 'User not found'
          }));
        }
        return TE.right(id);
      }),
      TE.chain((userId: string) =>
        TE.tryCatch(
          () => repository.delete(userId),
          error => createAppError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete user',
            cause: error
          })
        )
      )
    );

  const authenticate = (email: string, password: string): TaskEither<AppError, Option<User>> =>
    pipe(
      findByEmail(email),
      TE.chain((userOption: Option<User>) => {
        if (userOption._tag === 'None') {
          return TE.right(userOption);
        }
        return pipe(
          TE.tryCatch(
            async () => {
              const user = userOption.value;
              const isValid = await verifyPassword(user.password, password);
              return isValid ? userOption : O.fromNullable(null);
            },
            error => createAppError({
              code: 'UNAUTHORIZED',
              message: 'Authentication failed',
              cause: error
            })
          )
        );
      })
    );

  return {
    findByEmail,
    findById,
    create,
    update,
    remove,
    authenticate
  };
};

export * from './types'; 