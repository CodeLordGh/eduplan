import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { z } from 'zod';
import { Event } from '@eduflow/types';
import { Role, UserStatus } from '@eduflow/prisma';

// Base metadata schema
const metadataSchema = z.object({
  version: z.string(),
  source: z.string(),
  correlationId: z.string(),
  timestamp: z.string().datetime(),
  schemaVersion: z.string()
});

// Base event schema
const baseEventSchema = z.object({
  type: z.string(),
  data: z.unknown(),
  metadata: metadataSchema
});

// Event-specific schemas
const userCreatedSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  createdAt: z.date()
});

const userUpdatedSchema = z.object({
  userId: z.string().uuid(),
  updates: z.record(z.unknown()),
  updatedAt: z.date()
});

const userDeletedSchema = z.object({
  userId: z.string().uuid(),
  deletedAt: z.date()
});

const loginAttemptedSchema = z.object({
  userId: z.string().uuid(),
  success: z.boolean(),
  ip: z.string(),
  userAgent: z.string(),
  timestamp: z.date()
});

const otpGeneratedSchema = z.object({
  userId: z.string().uuid(),
  otpId: z.string().uuid(),
  purpose: z.string(),
  expiresAt: z.date(),
  generatedAt: z.date()
});

const kycVerifiedSchema = z.object({
  userId: z.string().uuid(),
  documentType: z.string(),
  verificationId: z.string(),
  verifiedAt: z.date()
});

const kycRejectedSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string(),
  rejectedAt: z.date()
});

const employmentEligibilityUpdatedSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(['ELIGIBLE', 'INELIGIBLE']),
  reason: z.string().optional(),
  updatedAt: z.date()
});

// Map of event types to their schemas
const eventSchemas = {
  USER_CREATED: userCreatedSchema,
  USER_UPDATED: userUpdatedSchema,
  USER_DELETED: userDeletedSchema,
  LOGIN_ATTEMPTED: loginAttemptedSchema,
  OTP_GENERATED: otpGeneratedSchema,
  KYC_VERIFIED: kycVerifiedSchema,
  KYC_REJECTED: kycRejectedSchema,
  EMPLOYMENT_ELIGIBILITY_UPDATED: employmentEligibilityUpdatedSchema
} as const;

/**
 * Validates an event against its schema
 */
export const validateEvent = <T>(event: Event<T>): TE.TaskEither<Error, Event<T>> =>
  pipe(
    TE.tryCatch(
      async () => {
        // Validate base event structure
        const baseResult = baseEventSchema.safeParse(event);
        if (!baseResult.success) {
          throw new Error(`Invalid event structure: ${baseResult.error.message}`);
        }

        // Validate event-specific data
        const schema = eventSchemas[event.type as keyof typeof eventSchemas];
        if (schema) {
          const dataResult = schema.safeParse(event.data);
          if (!dataResult.success) {
            throw new Error(`Invalid event data for ${event.type}: ${dataResult.error.message}`);
          }
        }

        return event;
      },
      error => error instanceof Error ? error : new Error(String(error))
    )
  ); 