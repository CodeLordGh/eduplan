import { EVENT_TYPES } from '@eduflow/constants';

export type EventMetadata = {
  correlationId: string;
  timestamp: string;
  source: string;
  version: string;
};

export type Event<T = unknown> = {
  type: keyof typeof EVENT_TYPES;
  payload: T;
  metadata: EventMetadata;
};

export type EventHandler<T = unknown> = (event: Event<T>) => Promise<void>;

export type EventBusConfig = {
  serviceName: string;
  rabbitmq: {
    url: string;
    exchange: string;
    deadLetterExchange: string;
    retryCount: number;
    retryDelay: number;
  };
  redis: {
    url: string;
    keyPrefix: string;
    eventTTL: number;
  };
};

export type PublishOptions = {
  persistent?: boolean;  // Use RabbitMQ persistence
  cache?: boolean;      // Cache in Redis
  cacheTTL?: number;    // Redis cache TTL
  priority?: number;    // RabbitMQ message priority
};

export type SubscribeOptions = {
  useCache?: boolean;   // Check Redis cache first
  pattern?: string;     // RabbitMQ routing pattern
  queue?: string;       // RabbitMQ queue name
  exclusive?: boolean;  // RabbitMQ exclusive queue
  durable?: boolean;    // RabbitMQ durable queue
};

export type EventBus = {
  publish<T>(event: Event<T>, options?: PublishOptions): Promise<void>;
  subscribe<T>(
    eventType: keyof typeof EVENT_TYPES,
    handler: EventHandler<T>,
    options?: SubscribeOptions
  ): Promise<void>;
  unsubscribe(eventType: keyof typeof EVENT_TYPES): Promise<void>;
}; 