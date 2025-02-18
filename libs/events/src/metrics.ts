import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { Event, Logger } from '@eduflow/types';
import { logger } from '@eduflow/logger';

interface MetricsState {
  eventProcessingTimes: Map<string, number[]>;
  eventCounts: Map<string, { success: number; error: number }>;
  queueSizes: Map<string, number>;
  deadLetterQueueSizes: Map<string, number>;
  cacheStats: Map<string, { hits: number; total: number }>;
}

const createMetricsState = (): MetricsState => ({
  eventProcessingTimes: new Map(),
  eventCounts: new Map(),
  queueSizes: new Map(),
  deadLetterQueueSizes: new Map(),
  cacheStats: new Map(),
});

let metricsState = createMetricsState();

/**
 * Records event processing time
 */
export const recordProcessingTime = (
  logger: Logger,
  eventType: string,
  service: string,
  startTime: number
): void => {
  const duration = (Date.now() - startTime) / 1000;

  // Update metrics state
  const times = metricsState.eventProcessingTimes.get(eventType) || [];
  times.push(duration);
  metricsState.eventProcessingTimes.set(eventType, times);

  // Log metric
  logger.info('Event processing time recorded', {
    metric: 'event_processing_duration_seconds',
    eventType,
    service,
    duration,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Increments event counter
 */
export const incrementEventCounter = (
  logger: Logger,
  eventType: string,
  service: string,
  status: 'success' | 'error'
): void => {
  // Update metrics state
  const counts = metricsState.eventCounts.get(eventType) || { success: 0, error: 0 };
  counts[status]++;
  metricsState.eventCounts.set(eventType, counts);

  // Log metric
  logger.info('Event processed', {
    metric: 'events_total',
    eventType,
    service,
    status,
    count: counts[status],
    timestamp: new Date().toISOString(),
  });
};

/**
 * Updates queue size metric
 */
export const updateQueueSize = (logger: Logger, queueName: string, size: number): void => {
  // Update metrics state
  metricsState.queueSizes.set(queueName, size);

  // Log metric
  logger.info('Queue size updated', {
    metric: 'event_queue_size',
    queueName,
    size,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Updates dead letter queue size metric
 */
export const updateDeadLetterQueueSize = (
  logger: Logger,
  queueName: string,
  size: number
): void => {
  // Update metrics state
  metricsState.deadLetterQueueSizes.set(queueName, size);

  // Log metric
  logger.info('Dead letter queue size updated', {
    metric: 'dead_letter_queue_size',
    queueName,
    size,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Updates cache hit ratio metric
 */
export const updateCacheHitRatio = (
  logger: Logger,
  service: string,
  hits: number,
  total: number
): void => {
  // Update metrics state
  metricsState.cacheStats.set(service, { hits, total });

  const ratio = total > 0 ? hits / total : 0;

  // Log metric
  logger.info('Cache hit ratio updated', {
    metric: 'event_cache_hit_ratio',
    service,
    hits,
    total,
    ratio,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Gets current metrics summary
 */
export const getMetricsSummary = (logger: Logger): Record<string, any> => {
  const summary = {
    eventProcessing: Object.fromEntries(
      Array.from(metricsState.eventProcessingTimes.entries()).map(([type, times]) => [
        type,
        {
          count: times.length,
          average: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
        },
      ])
    ),
    eventCounts: Object.fromEntries(metricsState.eventCounts),
    queueSizes: Object.fromEntries(metricsState.queueSizes),
    deadLetterQueueSizes: Object.fromEntries(metricsState.deadLetterQueueSizes),
    cacheStats: Object.fromEntries(metricsState.cacheStats),
  };

  // Log summary
  logger.info('Metrics summary generated', {
    metric: 'metrics_summary',
    summary,
    timestamp: new Date().toISOString(),
  });

  return summary;
};

/**
 * Resets metrics state
 */
export const resetMetrics = (): void => {
  metricsState = createMetricsState();
};

/**
 * Wraps event processing with metrics
 */
export const withMetrics = <T>(
  logger: Logger,
  event: Event<T>,
  service: string,
  processor: (event: Event<T>) => TE.TaskEither<Error, void>
): TE.TaskEither<Error, void> => {
  const startTime = Date.now();

  return pipe(
    processor(event),
    TE.map(() => {
      recordProcessingTime(logger, event.type, service, startTime);
      incrementEventCounter(logger, event.type, service, 'success');
    }),
    TE.mapLeft((error) => {
      incrementEventCounter(logger, event.type, service, 'error');
      return error;
    })
  );
};
