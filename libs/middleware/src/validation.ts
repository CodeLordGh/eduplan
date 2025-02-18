import { z } from 'zod';
import { FastifyRequest } from 'fastify';
import { Role } from '@eduflow/prisma';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role),
  phone: z.string().optional()
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export function validateCreateUser(request: FastifyRequest) {
  return createUserSchema.parse(request.body);
}
