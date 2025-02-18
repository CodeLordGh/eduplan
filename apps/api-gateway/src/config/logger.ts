import { createLogger, createErrorLogger } from '@eduflow/logger';
import { FastifyRequest } from 'fastify';
import { LOG_LEVELS, LogLevel, LoggerOptions } from '@eduflow/types';

export interface LogContext {
  service?: string;
  correlationId?: string;
  path?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  timestamp?: string;
  environment?: string;
  version?: string;
  statusCode?: number;
  responseTime?: number;
  error?: any;
}

export interface SecurityContext extends LogContext {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  outcome: 'blocked' | 'allowed' | 'flagged';
  details?: Record<string, any>;
}

export interface PerformanceContext extends LogContext {
  metricName: string;
  value: number;
  unit: string;
  threshold?: number;
  tags?: Record<string, any>;
}

export interface EventContext extends LogContext {
  eventType: string;
  exchange?: string;
  routingKey?: string;
  messageId?: string;
  payload?: Record<string, any>;
}

export interface CircuitBreakerContext extends LogContext {
  serviceName: string;
  state: 'open' | 'closed' | 'half-open';
  failureCount: number;
  lastFailureReason?: string;
  nextAttempt?: Date;
}

export interface MetricsContext extends LogContext {
  metrics: {
    cpu?: number;
    memory?: number;
    eventQueueSize?: number;
    activeConnections?: number;
    requestRate?: number;
  };
  thresholds?: Record<string, number>;
}

// Validate and get log level from environment
const getLogLevel = (level: string | undefined): LogLevel => {
  if (level && Object.values(LOG_LEVELS).includes(level as LogLevel)) {
    return level as LogLevel;
  }
  return LOG_LEVELS.INFO;
};

// Logger configuration
const loggerConfig = {
  service: 'api-gateway',
  level: process.env.LOG_LEVEL || 'info',
  prettyPrint: process.env.NODE_ENV !== 'production',
};

// Create base logger instance with configuration
export const logger = createLogger('api-gateway', loggerConfig);

// Create error logger
export const errorLogger = createErrorLogger(logger);

// Create request context utility
export const createRequestContext = (request: FastifyRequest): LogContext => ({
  service: 'api-gateway',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  correlationId: (request.headers['x-correlation-id'] as string) || request.id,
  version: request.apiVersion,
  method: request.method,
  path: request.url,
  url: request.url,
  ip: request.ip,
  userAgent: request.headers['user-agent'] as string,
});

// Create response context utility
export const createResponseContext = (
  request: FastifyRequest,
  statusCode: number,
  responseTime: number
): LogContext => ({
  ...createRequestContext(request),
  statusCode,
  responseTime,
});

// Create error context utility
export const createErrorContext = (
  request: FastifyRequest,
  error: Error
): LogContext & {
  error: {
    message: string;
    stack?: string;
    code?: string;
  };
} => ({
  ...createRequestContext(request),
  error: {
    message: error.message,
    stack: error.stack,
    code: (error as any).code,
  },
});

// Create security context utility
export const createSecurityContext = (
  request: FastifyRequest,
  eventType: string,
  severity: SecurityContext['severity'],
  outcome: SecurityContext['outcome'],
  details?: Record<string, any>
): SecurityContext => ({
  ...createResponseContext(request, 0, 0),
  eventType,
  severity,
  outcome,
  details,
});

// Create performance context utility
export const createPerformanceContext = (
  request: FastifyRequest,
  metricName: string,
  value: number,
  unit: string,
  threshold?: number,
  tags?: Record<string, any>
): PerformanceContext => ({
  ...createResponseContext(request, 0, 0),
  metricName,
  value,
  unit,
  threshold,
  tags,
});

// Create event context utility
export const createEventContext = (
  correlationId: string,
  eventType: string,
  exchange: string,
  routingKey: string,
  messageId: string,
  payload?: Record<string, any>
): EventContext => ({
  service: 'api-gateway',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  correlationId,
  eventType,
  exchange,
  routingKey,
  messageId,
  payload,
});

// Create circuit breaker context utility
export const createCircuitBreakerContext = (
  serviceName: string,
  state: CircuitBreakerContext['state'],
  failureCount: number,
  lastFailureReason?: string,
  nextAttempt?: Date
): CircuitBreakerContext => ({
  service: 'api-gateway',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  serviceName,
  state,
  failureCount,
  lastFailureReason,
  nextAttempt,
});

// Create metrics context utility
export const createMetricsContext = (
  metrics: MetricsContext['metrics'],
  thresholds?: Record<string, number>
): MetricsContext => ({
  service: 'api-gateway',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString(),
  metrics,
  thresholds,
});

// Security logging utility
export function logSecurityEvent(context: SecurityContext) {
  const levelMap = {
    low: 'info' as const,
    medium: 'warn' as const,
    high: 'error' as const,
    critical: 'fatal' as const,
  };

  const level = levelMap[context.severity];
  logger[level]('Security event detected', context);
}

// Performance logging utility
export const logPerformanceMetric = (context: PerformanceContext) => {
  const level = context.threshold && context.value > context.threshold ? 'warn' : 'info';
  logger[level]('Performance metric recorded', context);
};

// Event logging utility
export const logEvent = (context: EventContext) => {
  logger.info('Event processed', context);
};

// Circuit breaker logging utility
export const logCircuitBreakerStateChange = (context: CircuitBreakerContext) => {
  const level = context.state === 'open' ? 'error' : 'info';
  logger[level]('Circuit breaker state changed', context);
};

// Metrics logging utility
export const logMetrics = (context: MetricsContext) => {
  const hasThresholdViolation = Object.entries(context.metrics).some(
    ([key, value]) => context.thresholds?.[key] && value > context.thresholds[key]
  );
  const level = hasThresholdViolation ? 'warn' : 'info';
  logger[level]('System metrics recorded', context);
};
