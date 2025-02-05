import { EVENT_TYPES } from '@eduflow/constants';
import { Channel, Connection } from 'amqplib';
import Redis from 'ioredis';
import { Logger } from '@eduflow/logger';

export interface Event<T = unknown> {
  type: string;
  data: T;
  metadata: {
    version: string;
    source: string;
    correlationId: string;
    timestamp: string;
    schemaVersion: string;
  };
}

export type EventHandler<T = unknown> = (event: Event<T>) => Promise<void>;

export interface EventBusConfig {
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
}

export interface PublishOptions {
  persistent?: boolean;
  priority?: number;
  cache?: boolean;
}

export interface SubscribeOptions {
  queueName?: string;
  durable?: boolean;
  useCache?: boolean;
}

export interface EventBusState {
  rabbitmqChannel: Channel | null;
  rabbitmqConnection: Connection | null;
  redisClient: Redis | null;
  config: EventBusConfig;
  logger: Logger;
  handlers: Map<string, EventHandler>;
}

export type EventBus = {
  publish: <T>(event: Event<T>, options?: PublishOptions) => Promise<void>;
  subscribe: <T>(eventType: string, handler: EventHandler<T>, options?: SubscribeOptions) => Promise<void>;
  close: () => Promise<void>;
}; 