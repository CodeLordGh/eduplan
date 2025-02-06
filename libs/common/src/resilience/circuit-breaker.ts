import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { Logger } from '@eduflow/types';

export interface CircuitBreakerOptions {
  timeout: number;
  errorThreshold: number;
  resetTimeout: number;
  monitorInterval?: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const initialState: CircuitBreakerState = {
  failures: 0,
  lastFailure: null,
  status: 'CLOSED'
};

const monitor = (
  state: CircuitBreakerState,
  options: CircuitBreakerOptions,
  logger: Logger
): CircuitBreakerState => {
  if (state.status !== 'OPEN' || !state.lastFailure) {
    return state;
  }

  const timeSinceLastFailure = Date.now() - state.lastFailure;
  
  if (timeSinceLastFailure >= options.resetTimeout) {
    logger.info('Circuit breaker state changed to HALF_OPEN', {
      previousStatus: 'OPEN',
      timeSinceLastFailure
    });
    
    return {
      ...state,
      status: 'HALF_OPEN',
      failures: 0
    };
  }

  return state;
};

const recordSuccess = (
  state: CircuitBreakerState,
  logger: Logger
): CircuitBreakerState => {
  if (state.status === 'HALF_OPEN') {
    logger.info('Circuit breaker state changed to CLOSED', {
      previousStatus: 'HALF_OPEN'
    });
    
    return {
      failures: 0,
      lastFailure: null,
      status: 'CLOSED'
    };
  }
  return state;
};

const recordFailure = (
  state: CircuitBreakerState,
  options: CircuitBreakerOptions,
  logger: Logger
): CircuitBreakerState => {
  const newState = {
    ...state,
    failures: state.failures + 1,
    lastFailure: Date.now()
  };

  if (newState.failures >= options.errorThreshold) {
    logger.warn('Circuit breaker state changed to OPEN', {
      failures: newState.failures,
      threshold: options.errorThreshold
    });
    
    return {
      ...newState,
      status: 'OPEN'
    };
  }

  return newState;
};

export const createCircuitBreaker = (
  options: CircuitBreakerOptions,
  logger: Logger
) => {
  let state = initialState;
  
  if (options.monitorInterval) {
    setInterval(() => {
      state = monitor(state, options, logger);
    }, options.monitorInterval);
  }

  const wrap = <T>(operation: () => Promise<T>): TE.TaskEither<Error, T> =>
    TE.tryCatch(
      async () => {
        if (state.status === 'OPEN') {
          throw new Error('Circuit breaker is OPEN');
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timed out')), options.timeout);
        });

        try {
          const result = await Promise.race([operation(), timeoutPromise]);
          state = recordSuccess(state, logger);
          return result;
        } catch (error) {
          state = recordFailure(state, options, logger);
          throw error;
        }
      },
      E.toError
    );

  const getState = (): CircuitBreakerState => ({ ...state });

  return {
    wrap,
    getState
  };
}; 