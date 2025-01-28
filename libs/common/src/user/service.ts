import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { TaskEither } from 'fp-ts/TaskEither';
import * as O from 'fp-ts/Option';
import { Option } from 'fp-ts/Option';
import { validateEmail, validatePassword } from '@eduflow/validators';
import { User, CreateUserInput, UpdateUserInput, UserRepository } from './types';
import { hashPassword, verifyPassword } from '../security';

// Error types
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class ValidationError extends UserError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateEmailError extends UserError {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'DuplicateEmailError';
  }
}

// Validation functions
const validateCreateUserInput = (input: CreateUserInput): TaskEither<ValidationError, CreateUserInput> =>
  TE.tryCatch(
    async () => {
      if (!validateEmail(input.email)) {
        throw new ValidationError('Invalid email format');
      }
      if (!validatePassword(input.password)) {
        throw new ValidationError('Invalid password format');
      }
      return input;
    },
    error => error as ValidationError
  );

const validateUpdateUserInput = (input: UpdateUserInput): TaskEither<ValidationError, UpdateUserInput> =>
  TE.tryCatch(
    async () => {
      if (input.email && !validateEmail(input.email)) {
        throw new ValidationError('Invalid email format');
      }
      if (input.password && !validatePassword(input.password)) {
        throw new ValidationError('Invalid password format');
      }
      return input;
    },
    error => error as ValidationError
  );

// User service factory
export const createUserService = (repository: UserRepository) => {
  const findByEmail = (email: string): TaskEither<Error, Option<User>> =>
    TE.tryCatch(
      async () => O.fromNullable(await repository.findByEmail(email)),
      error => error as Error
    );

  const findById = (id: string): TaskEither<Error, Option<User>> =>
    TE.tryCatch(
      async () => O.fromNullable(await repository.findById(id)),
      error => error as Error
    );

  const create = (input: CreateUserInput): TaskEither<Error, User> =>
    pipe(
      input,
      validateCreateUserInput,
      TE.chain(() => findByEmail(input.email)),
      TE.chain((existingUser: Option<User>) => {
        if (existingUser._tag === 'Some') {
          return TE.left(new DuplicateEmailError(input.email));
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
          error => error as Error
        )
      )
    );

  const update = (id: string, input: UpdateUserInput): TaskEither<Error, User> =>
    pipe(
      input,
      validateUpdateUserInput,
      TE.chain(() => findById(id)),
      TE.chain((existingUser: Option<User>) => {
        if (existingUser._tag === 'None') {
          return TE.left(new UserError('User not found'));
        }
        return TE.right({ existingUser: existingUser.value, input });
      }),
      TE.chain(({ existingUser, input }: { existingUser: User; input: UpdateUserInput }) =>
        TE.tryCatch(
          async () => {
            const updates = { ...input };
            if (input.password) {
              updates.password = await hashPassword(input.password);
            }
            return repository.update(id, updates);
          },
          error => error as Error
        )
      )
    );

  const remove = (id: string): TaskEither<Error, void> =>
    pipe(
      findById(id),
      TE.chain((existingUser: Option<User>) => {
        if (existingUser._tag === 'None') {
          return TE.left(new UserError('User not found'));
        }
        return TE.right(id);
      }),
      TE.chain((userId: string) =>
        TE.tryCatch(
          () => repository.delete(userId),
          error => error as Error
        )
      )
    );

  const authenticate = (email: string, password: string): TaskEither<Error, Option<User>> =>
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
            error => error as Error
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