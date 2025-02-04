import { AppError, ErrorCode, ErrorMetadata } from '@eduflow/types';
import { getErrorMetadata } from './utils';
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';
import * as TE from 'fp-ts/TaskEither';

/**
 * Error matcher for testing
 */
export const expectError = (fn: () => unknown) => {
  let thrownError: AppError;

  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if ((error as AppError).code) {
      thrownError = error as AppError;
    } else {
      throw new Error('Expected function to throw an AppError');
    }
  }

  return {
    toHaveErrorCode: (code: ErrorCode) => {
      expect(thrownError.code).toBe(code);
      return true;
    },

    toHaveStatusCode: (statusCode: number) => {
      expect(thrownError.statusCode).toBe(statusCode);
      return true;
    },

    toHaveMetadata: <C extends ErrorCode>(
      code: C,
      metadata: Partial<ErrorMetadata[C]>
    ) => {
      const actualMetadata = getErrorMetadata(thrownError, code);
      expect(O.isSome(actualMetadata)).toBe(true);
      if (O.isSome(actualMetadata)) {
        expect(actualMetadata.value).toMatchObject(metadata);
      }
      return true;
    },

    toHaveCause: (cause: unknown) => {
      expect(thrownError.cause).toBe(cause);
      return true;
    }
  };
};

/**
 * Tests async error handling
 */
export const expectAsyncError = async <T>(
  te: TE.TaskEither<AppError, T>
) => {
  const result = await te();
  
  if (E.isRight(result)) {
    throw new Error('Expected TaskEither to fail');
  }

  const error = result.left;

  return {
    toHaveErrorCode: (code: ErrorCode) => {
      expect(error.code).toBe(code);
      return true;
    },

    toHaveStatusCode: (statusCode: number) => {
      expect(error.statusCode).toBe(statusCode);
      return true;
    },

    toHaveMetadata: <C extends ErrorCode>(
      code: C,
      metadata: Partial<ErrorMetadata[C]>
    ) => {
      const actualMetadata = getErrorMetadata(error, code);
      expect(O.isSome(actualMetadata)).toBe(true);
      if (O.isSome(actualMetadata)) {
        expect(actualMetadata.value).toMatchObject(metadata);
      }
      return true;
    },

    toHaveCause: (cause: unknown) => {
      expect(error.cause).toBe(cause);
      return true;
    }
  };
};

/**
 * Creates a mock error for testing
 */
export const createMockError = <C extends ErrorCode>(
  code: C,
  metadata?: ErrorMetadata[C]
): AppError => ({
  code,
  name: code,
  message: `Mock ${code} error`,
  statusCode: 500, // Default status code for mocks
  metadata
}); 