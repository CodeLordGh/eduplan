// Gateway-specific event literals
export const GatewayEventType = {
  SERVICE_REGISTERED: 'SERVICE_REGISTERED',
  SERVICE_HEALTH_CHANGED: 'SERVICE_HEALTH_CHANGED',
  CIRCUIT_BREAKER_STATE_CHANGED: 'CIRCUIT_BREAKER_STATE_CHANGED'
} as const;

// Type for gateway event names
export type GatewayEventType = (typeof GatewayEventType)[keyof typeof GatewayEventType];