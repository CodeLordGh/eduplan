import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import { z } from 'zod';
import { Event, validation } from '@eduflow/types';
import { Role, UserStatus } from '@eduflow/prisma';

const { stringSchema, commonSchemas, validateWithSchema } = validation;

// Base metadata schema
const metadataSchema = z.object({
  version: stringSchema.nonEmpty,
  source: stringSchema.nonEmpty,
  correlationId: stringSchema.uuid,
  timestamp: stringSchema.date,
  schemaVersion: stringSchema.nonEmpty,
});

// Base event schema
const baseEventSchema = z.object({
  type: stringSchema.nonEmpty,
  data: z.unknown(),
  metadata: metadataSchema,
});

// Event-specific schemas
const userCreatedSchema = z.object({
  userId: stringSchema.uuid,
  email: stringSchema.email,
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  createdAt: z.date(),
});

const userUpdatedSchema = z.object({
  userId: stringSchema.uuid,
  updates: z.record(z.unknown()),
  updatedAt: z.date(),
});

const userDeletedSchema = z.object({
  userId: stringSchema.uuid,
  deletedAt: z.date(),
});

const loginAttemptedSchema = z.object({
  userId: stringSchema.uuid,
  success: z.boolean(),
  ip: stringSchema.nonEmpty,
  userAgent: stringSchema.nonEmpty,
  timestamp: z.date(),
});

const otpGeneratedSchema = z.object({
  userId: stringSchema.uuid,
  otpId: stringSchema.uuid,
  purpose: stringSchema.nonEmpty,
  expiresAt: z.date(),
  generatedAt: z.date(),
});

const kycVerifiedSchema = z.object({
  userId: stringSchema.uuid,
  documentType: stringSchema.nonEmpty,
  verificationId: stringSchema.nonEmpty,
  verifiedAt: z.date(),
});

const kycRejectedSchema = z.object({
  userId: stringSchema.uuid,
  reason: stringSchema.nonEmpty,
  rejectedAt: z.date(),
});

const employmentEligibilityUpdatedSchema = z.object({
  userId: stringSchema.uuid,
  status: z.enum(['ELIGIBLE', 'INELIGIBLE']),
  reason: z.string().optional(),
  updatedAt: z.date(),
});

// Event type definitions
export const EventType = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  LOGIN_ATTEMPTED: 'LOGIN_ATTEMPTED',
  OTP_GENERATED: 'OTP_GENERATED',
  KYC_VERIFIED: 'KYC_VERIFIED',
  KYC_REJECTED: 'KYC_REJECTED',
  EMPLOYMENT_ELIGIBILITY_UPDATED: 'EMPLOYMENT_ELIGIBILITY_UPDATED',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

// Map event types to their data schemas
export type EventDataSchemaMap = {
  [EventType.USER_CREATED]: typeof userCreatedSchema;
  [EventType.USER_UPDATED]: typeof userUpdatedSchema;
  [EventType.USER_DELETED]: typeof userDeletedSchema;
  [EventType.LOGIN_ATTEMPTED]: typeof loginAttemptedSchema;
  [EventType.OTP_GENERATED]: typeof otpGeneratedSchema;
  [EventType.KYC_VERIFIED]: typeof kycVerifiedSchema;
  [EventType.KYC_REJECTED]: typeof kycRejectedSchema;
  [EventType.EMPLOYMENT_ELIGIBILITY_UPDATED]: typeof employmentEligibilityUpdatedSchema;
};

// Map event types to their data types
export type EventDataMap = {
  [K in EventType]: z.infer<EventDataSchemaMap[K]>;
};

// Event schema registry
const eventSchemas: EventDataSchemaMap = {
  [EventType.USER_CREATED]: userCreatedSchema,
  [EventType.USER_UPDATED]: userUpdatedSchema,
  [EventType.USER_DELETED]: userDeletedSchema,
  [EventType.LOGIN_ATTEMPTED]: loginAttemptedSchema,
  [EventType.OTP_GENERATED]: otpGeneratedSchema,
  [EventType.KYC_VERIFIED]: kycVerifiedSchema,
  [EventType.KYC_REJECTED]: kycRejectedSchema,
  [EventType.EMPLOYMENT_ELIGIBILITY_UPDATED]: employmentEligibilityUpdatedSchema,
};

/**
 * Type-safe validation for specific event types
 */
export const validateEventData = {
  [EventType.USER_CREATED]: (data: unknown) => validateWithSchema(userCreatedSchema, data),
  [EventType.USER_UPDATED]: (data: unknown) => validateWithSchema(userUpdatedSchema, data),
  [EventType.USER_DELETED]: (data: unknown) => validateWithSchema(userDeletedSchema, data),
  [EventType.LOGIN_ATTEMPTED]: (data: unknown) => validateWithSchema(loginAttemptedSchema, data),
  [EventType.OTP_GENERATED]: (data: unknown) => validateWithSchema(otpGeneratedSchema, data),
  [EventType.KYC_VERIFIED]: (data: unknown) => validateWithSchema(kycVerifiedSchema, data),
  [EventType.KYC_REJECTED]: (data: unknown) => validateWithSchema(kycRejectedSchema, data),
  [EventType.EMPLOYMENT_ELIGIBILITY_UPDATED]: (data: unknown) =>
    validateWithSchema(employmentEligibilityUpdatedSchema, data),
};

/**
 * Validates an event against its schema
 */
export const validateEvent = <T extends EventType>(
  event: Event<unknown>
): TE.TaskEither<Error, Event<EventDataMap[T]>> =>
  pipe(
    TE.tryCatch(
      async () => {
        // Validate base event structure
        const baseValidation = validateWithSchema(baseEventSchema, event);
        if (!baseValidation.success) {
          throw new Error(`Invalid event structure: ${baseValidation.error}`);
        }

        // Get and validate event-specific schema
        const validateData = validateEventData[event.type as T];
        if (!validateData) {
          throw new Error(`Unknown event type: ${event.type}`);
        }

        const dataValidation = validateData(event.data);
        if (!dataValidation.success) {
          throw new Error(`Invalid event data for ${event.type}: ${dataValidation.error}`);
        }

        // Return the validated event with the correct type
        return {
          ...event,
          data: dataValidation.data,
        } as Event<EventDataMap[T]>;
      },
      (error) => (error instanceof Error ? error : new Error(String(error)))
    )
  );

// Export types for event data
export type EventMetadata = z.infer<typeof metadataSchema>;
export type BaseEvent = z.infer<typeof baseEventSchema>;
export type UserCreatedEvent = z.infer<typeof userCreatedSchema>;
export type UserUpdatedEvent = z.infer<typeof userUpdatedSchema>;
export type UserDeletedEvent = z.infer<typeof userDeletedSchema>;
export type LoginAttemptedEvent = z.infer<typeof loginAttemptedSchema>;
export type OtpGeneratedEvent = z.infer<typeof otpGeneratedSchema>;
export type KycVerifiedEvent = z.infer<typeof kycVerifiedSchema>;
export type KycRejectedEvent = z.infer<typeof kycRejectedSchema>;
export type EmploymentEligibilityUpdatedEvent = z.infer<typeof employmentEligibilityUpdatedSchema>;
