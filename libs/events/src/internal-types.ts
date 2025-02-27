import { Channel, Connection } from 'amqplib';
import { Logger, EventBusState as BaseEventBusState, EventHandler } from '@eduflow/types';

export interface EventBusInternalState extends BaseEventBusState {
  rabbitmqChannel: Channel | null;
  rabbitmqConnection: Connection | null;
  config: BaseEventBusState['config'];
  logger: Logger;
  handlers: Map<string, EventHandler>;
  consumerTags: Map<string, string>;
}
