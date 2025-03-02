import { Event, EventType, EventDataMap } from '@eduflow/types';
import { createLogger } from '@eduflow/logger';
import { createEventHandler } from './handlers';
import {
  updateServiceRegistration,
  updateServiceHealth,
  updateCircuitBreakerStatus
} from '../store/service-registry';

const logger = createLogger('api-gateway:event-handlers');

export const handleServiceRegistration = createEventHandler<EventDataMap[typeof EventType.SERVICE_REGISTERED]>(
  EventType.SERVICE_REGISTERED,
  async (event) => {
    logger.info('Service registration event received', {
      serviceName: event.data.serviceName,
      endpoints: event.data.endpoints
    });
    await updateServiceRegistration(event.data.serviceName, event.data.endpoints);
  }
);

export const handleServiceHealth = createEventHandler<EventDataMap[typeof EventType.SERVICE_HEALTH_CHANGED]>(
  EventType.SERVICE_HEALTH_CHANGED,
  async (event) => {
    logger.info('Service health event received', {
      serviceName: event.data.serviceName,
      status: event.data.status
    });
    await updateServiceHealth(event.data.serviceName, event.data.status);
  }
);

export const handleCircuitBreakerEvent = createEventHandler<EventDataMap[typeof EventType.CIRCUIT_BREAKER_STATE_CHANGED]>(
  EventType.CIRCUIT_BREAKER_STATE_CHANGED,
  async (event) => {
    logger.info('Circuit breaker state changed', {
      serviceName: event.data.serviceName,
      status: event.data.status
    });
    await updateCircuitBreakerStatus(event.data.serviceName, event.data.status);
  }
);