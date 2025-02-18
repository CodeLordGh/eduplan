import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { Role } from '@eduflow/types';
import { createRateLimiter, validateCreateUser } from '@eduflow/middleware';
import * as authService from '../service/auth.service';
import { ROLES } from '@eduflow/constants';
import { FastifyInstance } from 'fastify';
import { CreateUserInput } from '../domain/user';
import { z } from 'zod';
import { emailSchema, passwordSchema } from '@eduflow/common';

const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

type RegisterBody = z.infer<typeof registerBodySchema>;
type LoginBody = z.infer<typeof loginSchema>;
type RefreshBody = z.infer<typeof refreshSchema>;

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Rate limiters
  const loginLimiter = createRateLimiter(fastify.redis, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyPrefix: 'login:',
  });

  const registerLimiter = createRateLimiter(fastify.redis, {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyPrefix: 'register:',
  });

  const refreshLimiter = createRateLimiter(fastify.redis, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    keyPrefix: 'refresh:',
  });

  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['STUDENT', 'TEACHER', 'ADMIN'] },
          phone: { type: 'string', nullable: true },
        },
      },
    },
    preValidation: async (request, reply) => {
      const result = registerBodySchema.safeParse(request.body);
      if (!result.success) {
        reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          errors: result.error.errors,
        });
        return;
      }
    },
    handler: async (request, reply) => {
      const { email, password, role, phone } = validateCreateUser(request);
      const user = await authService.register({
        email,
        password,
        roles: [role],
        phone,
      });
      return reply.code(201).send(user);
    },
  });

  fastify.post<{
    Body: {
      email: string;
      password: string;
    };
  }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
    },
    preHandler: loginLimiter,
    handler: async (request, reply) => {
      const result = await pipe(
        authService.login(fastify.redis, {
          ...request.body,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] || 'unknown',
        }),
        TE.match(
          (error) => {
            switch (error.code) {
              case 'UNAUTHORIZED':
              case 'NOT_FOUND':
                return reply.code(401).send(error);
              default:
                return reply.code(500).send(error);
            }
          },
          (authResult) => {
            reply.setCookie('refreshToken', authResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/auth/refresh',
              maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            });
            return reply.code(200).send({
              user: authResult.user,
              accessToken: authResult.accessToken,
            });
          }
        )
      )();
      return result;
    },
  });

  fastify.post<{
    Body: {
      refreshToken: string;
    };
  }>('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
    preHandler: refreshLimiter,
    handler: async (request, reply) => {
      const result = await pipe(
        authService.refresh(
          fastify.redis,
          request.body.refreshToken,
          request.ip,
          request.headers['user-agent'] || 'unknown'
        ),
        TE.match(
          (error) => {
            switch (error.code) {
              case 'NOT_FOUND':
              case 'UNAUTHORIZED':
                return reply.code(401).send(error);
              default:
                return reply.code(500).send(error);
            }
          },
          (authResult) => {
            reply.setCookie('refreshToken', authResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/auth/refresh',
              maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            });
            return reply.code(200).send({
              user: authResult.user,
              accessToken: authResult.accessToken,
            });
          }
        )
      )();
      return result;
    },
  });

  fastify.post<{
    Body: {
      refreshToken: string;
    };
  }>('/logout', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const result = await pipe(
        authService.logout(fastify.redis, request.body.refreshToken),
        TE.match(
          (error) => reply.code(500).send(error),
          () => {
            reply.clearCookie('refreshToken', { path: '/auth/refresh' });
            return reply.code(200).send({ message: 'Logged out successfully' });
          }
        )
      )();
      return result;
    },
  });
};

export default authRoutes;
