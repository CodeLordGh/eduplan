import { z } from 'zod';

/**
 * Common validation schemas that can be reused across the application
 */

export const stringSchema = {
  email: z.string().email('Invalid email format'),
  uuid: z.string().uuid('Invalid UUID format'),
  nonEmpty: z.string().min(1, 'Field cannot be empty'),
  url: z.string().url('Invalid URL format'),
  date: z.string().datetime('Invalid date format'),
};

export const numberSchema = {
  positive: z.number().positive('Number must be positive'),
  nonNegative: z.number().min(0, 'Number must be non-negative'),
  percentage: z
    .number()
    .min(0, 'Percentage must be between 0 and 100')
    .max(100, 'Percentage must be between 0 and 100'),
  port: z.number().int().min(1).max(65535),
};

export const commonSchemas = {
  metadata: z.record(z.unknown()).optional(),
  timestamps: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
  pagination: z.object({
    page: numberSchema.positive,
    limit: numberSchema.positive,
  }),
};

/**
 * Helper function to create a validation result
 */
export type ValidationResult<T> = {
  success: boolean;
  data?: T | undefined;
  error?: string;
};

export const createValidationResult = <T>(
  success: boolean,
  data?: T,
  error?: string
): ValidationResult<T> => ({
  success,
  data,
  error,
});

/**
 * Generic validation wrapper using Zod schema
 */
export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> => {
  try {
    const validData = schema.parse(data);
    return createValidationResult<T>(true, validData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createValidationResult<T>(false, undefined, error.errors[0].message);
    }
    return createValidationResult<T>(false, undefined, 'Validation failed');
  }
};
