import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
export declare const errorHandler: (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => FastifyReply<import("fastify").RawServerDefault, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").RouteGenericInterface, unknown, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown>;
export * from './base.error';
//# sourceMappingURL=index.d.ts.map