export interface RabbitMQConfig {
  url: string;
  exchange: string;
  deadLetterExchange: string;
  retryCount: number;
  retryDelay: number;
}

export interface EventBusConfig {
  serviceName: string;
  rabbitmq: RabbitMQConfig;
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
