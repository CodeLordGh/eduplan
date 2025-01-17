import { FastifyPluginAsync } from 'fastify';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { createRateLimiter, RateLimitConfig, authenticate, AuthenticatedUser } from '@eduflow/middleware';
import * as otpService from '../service/otp.service';

interface OTPGenerateBody {
  purpose: otpService.OTPPurpose;
  email: string;
}

interface OTPVerifyBody {
  code: string;
  purpose: otpService.OTPPurpose;
}

const otpRoutes: FastifyPluginAsync = async (fastify) => {
  const otpLimiter = createRateLimiter(fastify.redis, {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyPrefix: 'otp:'
  } as RateLimitConfig);

  fastify.post<{ Body: OTPGenerateBody }>('/generate', {
    schema: {
      body: {
        type: 'object',
        required: ['purpose', 'email'],
        properties: {
          purpose: {
            type: 'string',
            enum: Object.values(otpService.OTPPurpose)
          },
          email: {
            type: 'string',
            format: 'email'
          }
        }
      }
    },
    preHandler: [authenticate, otpLimiter],
    handler: async (request, reply) => {
      const user = request.user as AuthenticatedUser;
      const result = await pipe(
        otpService.generateOTP(
          fastify.redis,
          user.id,
          request.body.email,
          request.body.purpose
        ),
        TE.match(
          (error) => reply.code(500).send(error),
          (code) => reply.code(200).send({ code })
        )
      )();
      return result;
    }
  });

  fastify.post<{ Body: OTPVerifyBody }>('/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['code', 'purpose'],
        properties: {
          code: { type: 'string' },
          purpose: {
            type: 'string',
            enum: Object.values(otpService.OTPPurpose)
          }
        }
      }
    },
    preHandler: authenticate,
    handler: async (request, reply) => {
      const user = request.user as AuthenticatedUser;
      const result = await pipe(
        otpService.verifyOTP(
          fastify.redis,
          user.id,
          request.body.code,
          request.body.purpose
        ),
        TE.match(
          (error) => reply.code(500).send(error),
          (isValid) =>
            isValid
              ? reply.code(200).send({ message: 'OTP verified successfully' })
              : reply.code(400).send({ message: 'Invalid OTP' })
        )
      )();
      return result;
    }
  });
};

export default otpRoutes;