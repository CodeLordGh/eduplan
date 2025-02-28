import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import { createAppError, createPolicy, validateAccess } from '@eduflow/common';
import { Logger, UserAttributes, KYCStatus, EmploymentEligibilityStatus } from '@eduflow/types';
import type { Role } from '@eduflow/types';
import { authenticate, authorize } from '@eduflow/middleware';

export interface SecurityPluginOptions {
  logger: Logger;
}

const securityPlugin: FastifyPluginAsync<SecurityPluginOptions> = async (
  fastify,
  opts
): Promise<void> => {
  const { logger } = opts;
  
  try {
    // Register helmet
    await fastify.register(helmet as never, {
      global: true,
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        }
      }
    });

    // Register CORS
    await fastify.register(cors as never, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    });

    // Register authentication and authorization
    fastify.decorate('authenticate', authenticate);
    fastify.decorate('authorize', authorize);

    // Register ABAC policy and middleware
    const abacPolicy = createPolicy('resource', 'READ', {
      anyOf: { roles: ['TEACHER', 'SCHOOL_ADMIN'] as Role[] },
      verification: { requireKYC: true }
    });

    const abacMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
      const authenticatedRequest = await authenticate(request);
      const userAttributes: UserAttributes = {
        ...authenticatedRequest.user,
        status: 'ACTIVE',
        globalRoles: [authenticatedRequest.user.role],
        schoolRoles: {},
        kyc: { status: KYCStatus.VERIFIED },
        employment: { status: EmploymentEligibilityStatus.ELIGIBLE },
        access: { failedAttempts: 0, mfaEnabled: false, mfaVerified: false },
        context: {}
      };
      const validationResult = validateAccess(userAttributes, abacPolicy, {
        params: authenticatedRequest.params,
        query: authenticatedRequest.query,
        body: authenticatedRequest.body,
      });

      if (!validationResult.granted) {
        reply.status(403).send({ error: validationResult.reason });
      }
    };

    fastify.decorate('abacMiddleware', abacMiddleware);
    
    logger.info('Security plugins registered successfully');
  } catch (error) {
    const err = error instanceof Error ? error : createAppError({
      code: 'BAD_REQUEST',
      message: 'Unknown error',
      cause: error
    });
    logger.error('Failed to register security plugins', { error: err });
    throw createAppError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to register security plugins',
      cause: err
    });
  }
};

export default fp(securityPlugin, {
  name: 'security',
  fastify: '5.x'
});