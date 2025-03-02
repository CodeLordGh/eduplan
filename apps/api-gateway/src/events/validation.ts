import { z } from 'zod';
import { GatewayEventType } from './types';

// Service registration schema
export const serviceRegistrationSchema = z.object({
  serviceName: z.string(),
  endpoints: z.array(z.string())
});

// Service health schema
export const serviceHealthSchema = z.object({
  serviceName: z.string(),
  status: z.enum(['up', 'down'])
});

// Circuit breaker schema
export const circuitBreakerSchema = z.object({
  serviceName: z.string(),
  status: z.enum(['open', 'closed', 'half-open'])
});

// Map gateway event types to their schemas
export const gatewayEventSchemas = {
  [GatewayEventType.SERVICE_REGISTERED]: serviceRegistrationSchema,
  [GatewayEventType.SERVICE_HEALTH_CHANGED]: serviceHealthSchema,
  [GatewayEventType.CIRCUIT_BREAKER_STATE_CHANGED]: circuitBreakerSchema,
} as const;

// Export validation functions
export const validateGatewayEventData = {
  [GatewayEventType.SERVICE_REGISTERED]: (data: unknown) => serviceRegistrationSchema.safeParse(data),
  [GatewayEventType.SERVICE_HEALTH_CHANGED]: (data: unknown) => serviceHealthSchema.safeParse(data),
  [GatewayEventType.CIRCUIT_BREAKER_STATE_CHANGED]: (data: unknown) => circuitBreakerSchema.safeParse(data),
};