import type { ConfirmChannel } from 'amqplib';
import { Logger } from '@eduflow/types';

export interface BatchProcessorOptions {
  batchSize: number;
  flushInterval: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface BatchItem<T> {
  exchange: string;
  routingKey: string;
  content: T;
  headers?: Record<string, unknown>;
}

export interface BatchState<T> {
  items: BatchItem<T>[];
  timer: NodeJS.Timeout | null;
}

const publishBatch = async <T>(
  items: BatchItem<T>[],
  channel: ConfirmChannel,
  logger: Logger
): Promise<void> => {
  // Publish messages in sequence
  for (const item of items) {
    channel.publish(item.exchange, item.routingKey, Buffer.from(JSON.stringify(item.content)), {
      persistent: true,
      headers: {
        ...item.headers,
        'x-batch-id': Date.now(),
        'x-batch-size': items.length,
      },
    });
  }

  // Wait for all messages to be confirmed
  await channel.waitForConfirms();

  logger.info('Successfully published batch', {
    batchSize: items.length,
  });
};

const retryBatch = async <T>(
  items: BatchItem<T>[],
  channel: ConfirmChannel,
  logger: Logger,
  retriesLeft: number,
  retryDelay: number,
  attempt = 1
): Promise<void> => {
  if (retriesLeft <= 0) {
    logger.error('Max retries exceeded for batch', {
      batchSize: items.length,
      totalAttempts: attempt,
    });
    return;
  }

  const delay = retryDelay * attempt;
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    await publishBatch(items, channel, logger);

    logger.info('Successfully published batch after retry', {
      batchSize: items.length,
      attempt,
    });
  } catch (error) {
    logger.warn('Retry attempt failed', {
      error: error instanceof Error ? error.message : String(error),
      batchSize: items.length,
      attempt,
      retriesLeft: retriesLeft - 1,
    });

    await retryBatch(items, channel, logger, retriesLeft - 1, retryDelay, attempt + 1);
  }
};

const flush = async <T>(
  state: BatchState<T>,
  channel: ConfirmChannel,
  options: BatchProcessorOptions,
  logger: Logger
): Promise<BatchState<T>> => {
  if (state.items.length === 0) {
    return state;
  }

  const items = [...state.items];

  try {
    await publishBatch(items, channel, logger);
    return { ...state, items: [] };
  } catch (error) {
    logger.error('Failed to publish batch', {
      error: error instanceof Error ? error.message : String(error),
      batchSize: items.length,
    });

    if (options.maxRetries && options.retryDelay) {
      await retryBatch(items, channel, logger, options.maxRetries, options.retryDelay);
      return { ...state, items: [] };
    }

    // If no retries configured or retries failed, keep items in batch
    return state;
  }
};

export const createBatchProcessor = <T>(
  channel: ConfirmChannel,
  options: BatchProcessorOptions,
  logger: Logger
) => {
  let state: BatchState<T> = {
    items: [],
    timer: null,
  };

  // Start flush timer
  state.timer = setInterval(async () => {
    state = await flush(state, channel, options, logger);
  }, options.flushInterval);

  const add = async (item: BatchItem<T>): Promise<void> => {
    state.items.push(item);

    if (state.items.length >= options.batchSize) {
      state = await flush(state, channel, options, logger);
    }
  };

  const close = async (): Promise<void> => {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }

    if (state.items.length > 0) {
      state = await flush(state, channel, options, logger);
    }
  };

  return {
    add,
    close,
  };
};
