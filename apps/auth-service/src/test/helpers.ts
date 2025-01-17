import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { Role, User } from '@eduflow/prisma';
import * as userRepo from '../repository/user.repository';
import { AuthErrors } from '../errors/auth';
import { CreateUserInput } from '../domain/user';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';

export const createTestUser = async (
  email: string = 'test@example.com',
  role: Role = Role.STUDENT
): Promise<User> => {
  const input: CreateUserInput = {
    email,
    password: 'Password123!',
    role
  };

  const result = await userRepo.createUser(input)();
  if (E.isLeft(result)) {
    throw new Error('Failed to create test user');
  }
  return result.right;
};

export const clearRedis = async (redis: Redis): Promise<void> => {
  await redis.flushall();
};

export const generateTestToken = (
  app: FastifyInstance,
  user: User
): string => {
  return app.jwt.sign({
    userId: user.id,
    email: user.email,
    role: user.role
  });
};
