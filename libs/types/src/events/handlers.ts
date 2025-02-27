import { Event, EventHandler } from './types';

// Re-export for backwards compatibility
export type { Event, EventHandler };

// Deprecated: Use types from types.ts instead
// Keeping this commented for reference during migration
/*
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
*/
