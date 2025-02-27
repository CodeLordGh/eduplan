import { Channel, Connection } from 'amqplib';
import { EventBusConfig, PublishOptions, SubscribeOptions } from './config';
import { Event, EventHandler } from './types';
import Redis from 'ioredis';

export interface EventBusState {
  config: EventBusConfig;
  handlers: Map<string, EventHandler>;
  consumerTags: Map<string, string>;
  rabbitmqChannel: Channel | null;
  rabbitmqConnection: Connection | null;
  redisClient: Redis | null;
}

export type EventBus = {
  publish: <T>(event: Event<T>, options?: PublishOptions) => Promise<void>;
  subscribe: <T>(eventType: string, handler: EventHandler<T>, options?: SubscribeOptions) => Promise<void>;
  close: () => Promise<void>;
};
