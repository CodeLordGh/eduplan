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
