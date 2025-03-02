import { EventHandler, Event, validateEvent } from '@eduflow/events';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createLogger } from '@eduflow/logger';
import { recordProcessingTime, incrementEventCounter } from '@eduflow/events';

const logger = createLogger('api-gateway:events');

export const createEventHandler = <T>(
  eventType: string,
  handler: (event: Event<T>) => Promise<void>
): EventHandler<T> => {
  return async (event: Event<T>): Promise<void> => {
    const startTime = Date.now();
    try {
      // Validate incoming event
      const validatedEvent = await pipe(
        validateEvent(event),
        TE.getOrElse((error) => {
          throw error;
        })
      )();

      // Process event
      await handler(validatedEvent);

      // Record metrics
      recordProcessingTime(logger, eventType, 'api-gateway', startTime);
      incrementEventCounter(logger, eventType, 'api-gateway', 'success');
    } catch (error) {
      incrementEventCounter(logger, eventType, 'api-gateway', 'error');
      throw error;
    }
  };
};