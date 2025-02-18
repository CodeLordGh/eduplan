import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createLogger } from '@eduflow/logger';
import { EventBusConfig } from '@eduflow/types';
import {
  createEventBusState,
  initialize,
  publish,
  subscribe,
  unsubscribe,
  close,
} from './event-bus';

export type EventBusOperations = {
  publish: ReturnType<typeof publish>;
  subscribe: ReturnType<typeof subscribe>;
  unsubscribe: ReturnType<typeof unsubscribe>;
  close: typeof close;
};

export const createEventBus = (
  config: EventBusConfig
): TE.TaskEither<Error, EventBusOperations> => {
  const logger = createLogger(config.serviceName);

  return pipe(
    createEventBusState(config, logger),
    initialize,
    TE.map((state) => ({
      publish: publish(state),
      subscribe: subscribe(state),
      unsubscribe: unsubscribe(state),
      close: () => close(state),
    }))
  );
};
