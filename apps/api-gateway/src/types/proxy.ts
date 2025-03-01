import { FastifyRequest } from 'fastify';
import { TaskEither } from 'fp-ts/TaskEither';
import { AppError } from '@eduflow/types';

export interface ServiceConfig {
  name: string;
  prefix: string;
  target: string;
  timeout?: number;
  circuitBreaker?: {
    failureThreshold: number;
    resetTimeout: number;
  };
}

export interface ProxyConfig {
  services: ServiceConfig[];
}

export type ProxyHandlerResult = TaskEither<AppError, void>;
export type RequestTransformer = (request: FastifyRequest) => TaskEither<AppError, void>;