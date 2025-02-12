import { z } from 'zod';
import { stringSchema, validateWithSchema } from '../validation/base';

export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

// Export types inferred from schemas
export type Email = z.infer<typeof stringSchema.email>;
export type Password = z.infer<typeof passwordSchema>;

// Auth-related schemas
export const loginCredentialsSchema = z.object({
  email: stringSchema.email,
  password: passwordSchema,
});

export const registrationSchema = loginCredentialsSchema
  .extend({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    confirmPassword: passwordSchema,
  })
  .refine(
    (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }
  );

// Validation functions using the new utilities
export const validateEmailWithSchema = (email: string) =>
  validateWithSchema(stringSchema.email, email);

export const validatePasswordWithSchema = (password: string) =>
  validateWithSchema(passwordSchema, password);

export const validateLoginCredentials = (credentials: unknown) =>
  validateWithSchema(loginCredentialsSchema, credentials);

export const validateRegistration = (registration: unknown) =>
  validateWithSchema(registrationSchema, registration);

// Types for validated data
export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type Registration = z.infer<typeof registrationSchema>;
