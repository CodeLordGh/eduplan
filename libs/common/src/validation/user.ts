import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const validateEmail = (email: string): boolean => {
  const result = emailSchema.safeParse(email);
  return result.success;
};

export const validatePassword = (password: string): boolean => {
  const result = passwordSchema.safeParse(password);
  return result.success;
}; 