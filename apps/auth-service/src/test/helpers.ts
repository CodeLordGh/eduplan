import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { Role, User, PrismaClient, UserStatus } from '@eduflow/prisma';
import * as userRepo from '../repository/user.repository';
import { AuthErrors } from '../errors/auth';
import { CreateUserInput } from '../domain/user';
import Redis from 'ioredis';
import { FastifyInstance } from 'fastify';
import { hashPassword } from '@eduflow/common';
import { ROLES } from '@eduflow/constants';

export const createTestUser = async (
  prisma: PrismaClient,
  {
    email = 'test@example.com',
    password = 'password123',
    role,
    phone = null,
  }: {
    email?: string;
    password?: string;
    role?: Role;
    phone?: string | null;
  } = {}
) => {
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      phone,
      roles: role ? [role] : [ROLES.USER as Role],
      status: UserStatus.ACTIVE,
    },
  });

  return {
    id: user.id,
    email: user.email,
    roles: user.roles,
    phone: user.phone,
  };
};

export const clearRedis = async (redis: Redis): Promise<void> => {
  await redis.flushall();
};

export const generateTestToken = (app: FastifyInstance, user: User): string => {
  return app.jwt.sign({
    userId: user.id,
    email: user.email,
    roles: user.roles,
  });
};
