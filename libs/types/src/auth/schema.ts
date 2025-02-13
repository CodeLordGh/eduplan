import { z } from 'zod';
import { Role, UserStatus } from '@eduflow/prisma';
import { stringSchema } from '../validation';
import { passwordSchema } from './validation';

// Base user schema - the single source of truth for user data structure
export const userSchema = z.object({
  id: stringSchema.uuid,
  email: stringSchema.email,
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  firstName: stringSchema.nonEmpty,
  lastName: stringSchema.nonEmpty,
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for user creation
export const createUserSchema = userSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Schema for user updates
export const updateUserSchema = userSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
