import { z } from 'zod';
import { EventMetadata } from './validation';
import { AuthEventType, AuthEventDataMap } from '../auth/events';
import { KYCEventType, KYCEventDataMap } from '../kyc/events';

/**
 * Combined Event Types
 */
export const EventType = {
  ...AuthEventType,
  ...KYCEventType,
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

/**
 * Combined Event Data Map
 */
export type EventDataMap = AuthEventDataMap & KYCEventDataMap;

/**
 * Base event interface
 */
export interface Event<T> {
  type: EventType;
  data: T;
  metadata: EventMetadata;
}

/**
 * Type helper for creating specific event types
 */
export type TypedEvent<T extends EventType> = Event<EventDataMap[T]>;

// Re-export domain event types for convenience
export type { AuthEventType, AuthEventDataMap, KYCEventType, KYCEventDataMap };
