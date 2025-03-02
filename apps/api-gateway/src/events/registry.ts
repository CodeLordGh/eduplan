import { EventBusOperations } from '@eduflow/events';
import { createLogger } from '@eduflow/logger';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { GatewayEventType } from './types';
import {
  handleServiceRegistration,
  handleServiceHealth,
  handleCircuitBreakerEvent
} from './specific-handlers';

const logger = createLogger('api-gateway:event-registry');

export const registerEventHandlers = (eventBus: EventBusOperations): TE.TaskEither<Error, void> => {
  return pipe(
    TE.Do,
    TE.chain(() => eventBus.subscribe(GatewayEventType.SERVICE_REGISTERED, handleServiceRegistration, {
      useCache: false,
      durable: true
    })),
    TE.chain(() => eventBus.subscribe(GatewayEventType.SERVICE_HEALTH_CHANGED, handleServiceHealth, {
      useCache: true,
      durable: true
    })),
    TE.chain(() => eventBus.subscribe(GatewayEventType.CIRCUIT_BREAKER_STATE_CHANGED, handleCircuitBreakerEvent, {
      useCache: true,
      durable: true
    })),
    TE.map(() => {
      logger.info('Event handlers registered successfully');
    }),
    TE.mapLeft((error) => {
      logger.error('Failed to register event handlers', { error });
      return error;
    })
  );
};