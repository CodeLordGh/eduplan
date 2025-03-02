import { Event, EventType as BaseEventType } from '@eduflow/types';
import { z } from 'zod';
import { serviceRegistrationSchema, serviceHealthSchema, circuitBreakerSchema } from './validation';

// Define EventMetadata interface
export interface EventMetadata {
  version: string;
  source: string;
  correlationId: string;
  timestamp: string;
  schemaVersion: string;
}

// Define gateway-specific event literals
export const GatewayEventType = {
  SERVICE_REGISTERED: 'SERVICE_REGISTERED',
  SERVICE_HEALTH_CHANGED: 'SERVICE_HEALTH_CHANGED',
  CIRCUIT_BREAKER_STATE_CHANGED: 'CIRCUIT_BREAKER_STATE_CHANGED'
} as const;

// Type for gateway event names
export type GatewayEventType = (typeof GatewayEventType)[keyof typeof GatewayEventType];

// Combined EventType including both base and gateway events
export type EventType = BaseEventType | GatewayEventType;

// Gateway event data types
export type ServiceRegistrationData = z.infer<typeof serviceRegistrationSchema>;
export type ServiceHealthData = z.infer<typeof serviceHealthSchema>;
export type CircuitBreakerData = z.infer<typeof circuitBreakerSchema>;

// Service Registration Event
export interface ServiceRegistrationEvent extends Event<ServiceRegistrationData> {
  type: typeof GatewayEventType.SERVICE_REGISTERED;
  data: ServiceRegistrationData;
  metadata: EventMetadata;
}

// Service Health Event
export interface ServiceHealthEvent extends Event<ServiceHealthData> {
  type: typeof GatewayEventType.SERVICE_HEALTH_CHANGED;
  data: ServiceHealthData;
  metadata: EventMetadata;
}

// Circuit Breaker Event
export interface CircuitBreakerEvent extends Event<CircuitBreakerData> {
  type: typeof GatewayEventType.CIRCUIT_BREAKER_STATE_CHANGED;
  data: CircuitBreakerData;
  metadata: EventMetadata;
}

// Union of all gateway events
export type GatewayEvent =
  | ServiceRegistrationEvent 
  | ServiceHealthEvent 
  | CircuitBreakerEvent;

// Event data map for gateway events
export type GatewayEventDataMap = {
  [K in GatewayEventType]: Extract<GatewayEvent, { type: K }>['data']
};