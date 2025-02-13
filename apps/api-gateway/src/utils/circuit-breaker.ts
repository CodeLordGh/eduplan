import { logCircuitBreakerStateChange } from '../config/logger';

interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  serviceName: string;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  state: 'closed' | 'open' | 'half-open';
  nextAttempt: Date | null;
}

const createInitialState = (): CircuitBreakerState => ({
  failures: 0,
  lastFailure: null,
  state: 'closed',
  nextAttempt: null,
});

const isOpen = (state: CircuitBreakerState): boolean => {
  if (state.state === 'open') {
    const now = new Date();
    return !(state.nextAttempt && now >= state.nextAttempt);
  }
  return false;
};

const handleSuccess = (state: CircuitBreakerState): CircuitBreakerState =>
  state.state === 'half-open' ? createInitialState() : state;

const handleFailure = (
  state: CircuitBreakerState,
  options: CircuitBreakerOptions,
  error: unknown
): CircuitBreakerState => {
  const newState = {
    ...state,
    failures: state.failures + 1,
    lastFailure: new Date(),
  };

  const finalState =
    newState.failures >= options.failureThreshold
      ? {
          ...newState,
          state: 'open' as const,
          nextAttempt: new Date(Date.now() + options.resetTimeout),
        }
      : newState;

  logCircuitBreakerStateChange({
    serviceName: options.serviceName,
    state: finalState.state,
    failureCount: finalState.failures,
    lastFailureReason: error instanceof Error ? error.message : 'Unknown error',
    nextAttempt: finalState.nextAttempt || undefined,
  });

  return finalState;
};

const transitionToHalfOpen = (
  state: CircuitBreakerState,
  options: CircuitBreakerOptions
): CircuitBreakerState => {
  const newState = {
    ...state,
    state: 'half-open' as const,
  };

  logCircuitBreakerStateChange({
    serviceName: options.serviceName,
    state: 'half-open',
    failureCount: state.failures,
    nextAttempt: undefined,
  });

  return newState;
};

export const createCircuitBreaker = (options: CircuitBreakerOptions) => {
  let state = createInitialState();

  const execute = async <T>(operation: () => Promise<T>): Promise<T> => {
    if (isOpen(state)) {
      throw new Error(`Circuit breaker is open for service: ${options.serviceName}`);
    }

    if (state.state === 'open') {
      state = transitionToHalfOpen(state, options);
    }

    try {
      const result = await operation();
      state = handleSuccess(state);
      return result;
    } catch (error) {
      state = handleFailure(state, options, error);
      throw error;
    }
  };

  const getState = (): CircuitBreakerState => ({ ...state });

  return {
    execute,
    getState,
  };
};
