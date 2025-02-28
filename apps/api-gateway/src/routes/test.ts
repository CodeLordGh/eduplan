import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { setRedisValue, getRedisValue, authenticate, authorize } from '@eduflow/middleware';
import { createPolicy, validateAccess } from '@eduflow/common';
import { KYCStatus, EmploymentEligibilityStatus, UserAttributes, Role } from '@eduflow/types';

const testRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // Test Redis
  fastify.get('/test/redis', {
    config: {
      bypassSession: true
    }
  }, async (_request, _reply) => {
    const testKey = 'test:key';
    const testValue = 'test-value';

    const result = await pipe(
      setRedisValue(fastify.redis)(testKey, testValue),
      TE.chain(() => getRedisValue(fastify.redis)(testKey))
    )();

    if (result._tag === 'Left') {
      throw result.left;
    }

    return {
      success: true,
      value: result.right,
    };
  });

  // Test Session
  fastify.get('/test/session', {
    config: {
      bypassSession: true
    }
  }, async (request, _reply) => {
    return {
      success: true,
      session: {
        userId: request.session.userId,
        role: request.session.role,
        permissions: request.session.permissions,
        createdAt: request.session.createdAt
      }
    };
  });

  // Middleware to bypass authentication
  const bypassAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.headers['x-bypass-auth'] === 'true') {
      request.user = {
        id: 'bypass-user',
        email: 'bypass@example.com',
        role: 'ADMIN'
      };
    } else {
      await authenticate(request);
    }
  };

  // Protected Endpoint
  fastify.get('/protected', { preHandler: [bypassAuth] }, async (request, reply) => {
    return { message: 'Access granted', user: request.user };
  });

  // Admin Endpoint
  fastify.get('/admin', { preHandler: [bypassAuth, authorize(['SYSTEM_ADMIN'])] }, async (request, reply) => {
    return { message: 'Admin endpoint', user: request.user };
  });

  // ABAC Endpoint
  fastify.get('/abac', { preHandler: [bypassAuth] }, async (request, reply) => {
    const abacPolicy = createPolicy('resource', 'READ', {
      anyOf: { roles: ['TEACHER', 'SCHOOL_ADMIN'] },
      verification: { requireKYC: true }
    });

    const userAttributes: UserAttributes = {
      id: 'user1',
      email: 'user1@example.com',
      // role: 'TEACHER',
      status: 'ACTIVE',
      globalRoles: ['TEACHER'],
      schoolRoles: {},
      kyc: { status: KYCStatus.VERIFIED },
      employment: { status: EmploymentEligibilityStatus.ELIGIBLE },
      access: { failedAttempts: 0, mfaEnabled: false, mfaVerified: false },
      context: {}
    };

    const validationResult = validateAccess(userAttributes, abacPolicy, {
      params: request.params,
      query: request.query,
      body: request.body,
    });

    if (!validationResult.granted) {
      reply.status(403).send({ error: validationResult.reason });
    } else {
      reply.send({ message: 'ABAC access granted' });
    }
  });
};

// @ts-expect-error - Fastify plugin type inference issues
export default fp(testRoutes, {
  name: 'test-routes',
  dependencies: ['redis-plugin', 'session-plugin'],
});