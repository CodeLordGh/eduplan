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