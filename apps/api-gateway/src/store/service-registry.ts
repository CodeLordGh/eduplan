import { createLogger } from '@eduflow/logger';

const logger = createLogger('api-gateway:service-registry');

export interface ServiceInfo {
  serviceName: string;
  status: 'up' | 'down';
  endpoints: string[];
  circuitBreakerStatus: 'open' | 'closed' | 'half-open';
  lastUpdated: Date;
}

interface ServiceRegistry {
  services: Map<string, ServiceInfo>;
}

const registry: ServiceRegistry = {
  services: new Map()
};

export const getServiceInfo = (serviceName: string): ServiceInfo | undefined =>
  registry.services.get(serviceName);

export const getAllServices = (): ServiceInfo[] =>
  Array.from(registry.services.values());

export const updateServiceRegistration = (
  serviceName: string, 
  endpoints: string[]
): void => {
  const existingService = registry.services.get(serviceName);
  if (existingService) {
    registry.services.set(serviceName, {
      ...existingService,
      endpoints,
      lastUpdated: new Date()
    });
  } else {
    registry.services.set(serviceName, {
      serviceName,
      endpoints,
      status: 'down',
      circuitBreakerStatus: 'closed',
      lastUpdated: new Date()
    });
  }
  logger.info('Service registration updated', { serviceName, endpoints });
};

export const updateServiceHealth = (
  serviceName: string,
  status: 'up' | 'down'
): void => {
  const existingService = registry.services.get(serviceName);
  if (!existingService) {
    logger.warn('Attempted to update health for unknown service', { serviceName });
    return;
  }
  registry.services.set(serviceName, {
    ...existingService,
    status,
    lastUpdated: new Date()
  });
  logger.info('Service health status updated', { serviceName, status });
};

export const updateCircuitBreakerStatus = (
  serviceName: string,
  status: 'open' | 'closed' | 'half-open'
): void => {
  const existingService = registry.services.get(serviceName);
  if (!existingService) {
    logger.warn('Attempted to update circuit breaker for unknown service', { serviceName });
    return;
  }
  registry.services.set(serviceName, {
    ...existingService,
    circuitBreakerStatus: status,
    lastUpdated: new Date()
  });
  logger.info('Circuit breaker status updated', { serviceName, status });
};