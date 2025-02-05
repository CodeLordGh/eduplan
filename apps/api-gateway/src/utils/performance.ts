import { FastifyRequest } from 'fastify';
import { logPerformanceMetric, createPerformanceContext } from '../config/logger';
import { getCorrelationId } from './correlation';

interface PerformanceThresholds {
  [key: string]: {
    warning: number;
    critical: number;
    unit: string;
  };
}

const defaultThresholds: PerformanceThresholds = {
  responseTime: {
    warning: 1000,    // 1 second
    critical: 5000,   // 5 seconds
    unit: 'ms'
  },
  databaseQuery: {
    warning: 500,     // 500ms
    critical: 2000,   // 2 seconds
    unit: 'ms'
  },
  externalService: {
    warning: 2000,    // 2 seconds
    critical: 8000,   // 8 seconds
    unit: 'ms'
  },
  memoryUsage: {
    warning: 80,      // 80%
    critical: 90,     // 90%
    unit: '%'
  }
};

export const measurePerformance = async <T>(
  name: string,
  operation: () => Promise<T>,
  request?: FastifyRequest,
  customThresholds?: Partial<PerformanceThresholds>
): Promise<T> => {
  const start = process.hrtime();
  
  try {
    const result = await operation();
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    const threshold = customThresholds?.[name] || defaultThresholds[name];
    
    if (threshold) {
      logPerformanceMetric(createPerformanceContext(
        request || { id: getCorrelationId() || 'unknown' } as FastifyRequest,
        name,
        duration,
        threshold.unit,
        threshold.warning,
        {
          correlationId: getCorrelationId(),
          thresholdType: duration > threshold.critical ? 'critical' : 
                        duration > threshold.warning ? 'warning' : 'normal'
        }
      ));
    }
    
    return result;
  } catch (error) {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    const threshold = customThresholds?.[name] || defaultThresholds[name];
    
    if (threshold) {
      logPerformanceMetric(createPerformanceContext(
        request || { id: getCorrelationId() || 'unknown' } as FastifyRequest,
        name,
        duration,
        threshold.unit,
        threshold.warning,
        {
          correlationId: getCorrelationId(),
          thresholdType: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      ));
    }
    
    throw error;
  }
};

export const trackDatabaseQuery = <T>(
  queryName: string,
  operation: () => Promise<T>,
  request?: FastifyRequest
): Promise<T> => {
  return measurePerformance(`db:${queryName}`, operation, request, {
    [`db:${queryName}`]: defaultThresholds.databaseQuery
  });
};

export const trackExternalService = <T>(
  serviceName: string,
  operation: () => Promise<T>,
  request?: FastifyRequest
): Promise<T> => {
  return measurePerformance(`service:${serviceName}`, operation, request, {
    [`service:${serviceName}`]: defaultThresholds.externalService
  });
};

export const trackMemoryUsage = (request?: FastifyRequest): void => {
  const used = process.memoryUsage();
  const percentUsed = (used.heapUsed / used.heapTotal) * 100;
  
  logPerformanceMetric(createPerformanceContext(
    request || { id: getCorrelationId() || 'unknown' } as FastifyRequest,
    'memory_usage',
    percentUsed,
    '%',
    defaultThresholds.memoryUsage.warning,
    {
      correlationId: getCorrelationId(),
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      external: used.external,
      rss: used.rss
    }
  ));
}; 