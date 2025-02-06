import { Channel, Connection } from 'amqplib';
import Redis from 'ioredis';
import { Logger, EventBusState as BaseEventBusState } from '@eduflow/types';

export interface EventBusInternalState extends BaseEventBusState {
  rabbitmqChannel: Channel | null;
  rabbitmqConnection: Connection | null;
  redisClient: Redis | null;
  logger: Logger;
} 