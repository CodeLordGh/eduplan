import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email format');

export const passwordSchema = z.string()
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
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;

// Additional auth-related schemas
export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const registrationSchema = loginCredentialsSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: passwordSchema
}).refine((data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>;
export type RegistrationData = z.infer<typeof registrationSchema>; 