import { EventBusConfig } from '@eduflow/types';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createEventBus, EventBusOperations } from '@eduflow/events';
import { createLogger } from '@eduflow/logger';
import { registerEventHandlers } from '../events/registry';

export const initEventBus = (): TE.TaskEither<Error, EventBusOperations> => {
  const logger = createLogger('api-gateway');
  
  const config: EventBusConfig = {
    serviceName: 'api-gateway',
    rabbitmq: {
      url: process.env.RABBITMQ_URL || 'amqp://localhost',
      exchange: 'eduflow',
      deadLetterExchange: 'eduflow.dlx',
      retryCount: 3,
      retryDelay: 1000,
    }
  };

  return pipe(
    createEventBus(config),
    TE.chain((eventBus) => pipe(
      registerEventHandlers(eventBus),
      TE.map(() => eventBus)
    )),
    TE.mapLeft((error) => {
      logger.error('Failed to initialize event bus', { error });
      return error;
    })
  );
};