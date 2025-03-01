import { FastifyRequest, FastifyReply } from 'fastify';
import { createProxyServer, ErrorCallback } from 'http-proxy';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createLogger } from '@eduflow/logger';
import { createAppError, createCircuitBreaker } from '@eduflow/common';
import { ServiceConfig } from '../types/proxy';
import { AppError } from '@eduflow/types';

const logger = createLogger('proxy-handler');

export const createProxyHandler = (serviceConfig: ServiceConfig) => {
  const proxy = createProxyServer({
    target: serviceConfig.target,
    changeOrigin: true,
    proxyTimeout: serviceConfig.timeout || 30000,
  });

  const circuitBreaker = serviceConfig.circuitBreaker 
    ? createCircuitBreaker({
        timeout: serviceConfig.timeout || 30000,
        errorThreshold: serviceConfig.circuitBreaker.failureThreshold,
        resetTimeout: serviceConfig.circuitBreaker.resetTimeout,
        monitorInterval: 1000
      }, logger)
    : undefined;

  const wrapError = (error: unknown): AppError => {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return error as AppError;
    }
    return createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Circuit breaker error',
      cause: error,
      metadata: {
        service: 'api-gateway',
        operation: 'circuitBreaker',
        timestamp: new Date()
      }
    });
  };

  const proxyRequest = (request: FastifyRequest, reply: FastifyReply): TE.TaskEither<AppError, void> =>
    TE.tryCatch(
      () => new Promise<void>((resolve, reject) => {
        proxy.web(request.raw, reply.raw, undefined, ((error: Error) => {
          if (error) {
            logger.error('Proxy error', { 
              service: serviceConfig.name, 
              error: error.message 
            });
            reject(error);
          } else {
            resolve();
          }
        }) as ErrorCallback);
      }),
      (error) => createAppError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Proxy request failed',
        cause: error as Error,
        metadata: {
          service: 'api-gateway',
          operation: 'proxyRequest',
          timestamp: new Date(),
          requestId: request.id
        }
      })
    );

  const handleCircuitBreaker = (result: void): TE.TaskEither<AppError, void> => 
    circuitBreaker
      ? TE.tryCatch(
          async () => {
            await circuitBreaker.wrap(() => Promise.resolve(result))();
            return result;
          },
          wrapError
        )
      : TE.right(result);

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const operation = proxyRequest(request, reply);
    const result = await pipe(
      operation,
      TE.chain(handleCircuitBreaker)
    )();

    if (result._tag === 'Left') {
      const appError = result.left as AppError;
      reply.status(appError.statusCode || 500).send({ error: appError });
    }
  };
};