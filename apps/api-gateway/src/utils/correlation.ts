import { FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

interface CorrelationContext {
  id: string;
  parentId?: string;
  requestPath?: string;
  requestMethod?: string;
  timestamp: string;
}

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export const getCorrelationId = (): string | undefined => {
  const context = correlationStorage.getStore();
  return context?.id;
};

export const getCorrelationContext = (): CorrelationContext | undefined => {
  return correlationStorage.getStore();
};

export const createCorrelationContext = (request: FastifyRequest): CorrelationContext => {
  const parentId = request.headers['x-correlation-id'] as string;
  const id = parentId || randomUUID();
  
  return {
    id,
    parentId: parentId !== id ? parentId : undefined,
    requestPath: request.url,
    requestMethod: request.method,
    timestamp: new Date().toISOString()
  };
};

export const withCorrelation = async <T>(
  context: CorrelationContext,
  operation: () => Promise<T>
): Promise<T> => {
  return correlationStorage.run(context, operation);
};

export const getCorrelationHeaders = (): Record<string, string> => {
  const context = correlationStorage.getStore();
  if (!context) return {};

  return {
    'x-correlation-id': context.id,
    'x-parent-correlation-id': context.parentId || context.id
  };
}; 