import { EventBusConfig, PublishOptions, SubscribeOptions } from './config';
import { Event, EventHandler } from './handlers';

export interface EventBusState {
  config: EventBusConfig;
  handlers: Map<string, EventHandler>;
}

export type EventBus = {
  publish: <T>(event: Event<T>, options?: PublishOptions) => Promise<void>;
  subscribe: <T>(eventType: string, handler: EventHandler<T>, options?: SubscribeOptions) => Promise<void>;
  close: () => Promise<void>;
}; 