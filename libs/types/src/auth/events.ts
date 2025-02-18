import { z } from 'zod';
import { Role, UserStatus, EmploymentEligibilityStatus } from '@eduflow/prisma';
import { KYCStatus } from './status';
import { stringSchema } from '../validation';
import { userSchema } from './schema';

// Auth Event Types
export const AuthEventType = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  LOGIN_ATTEMPTED: 'LOGIN_ATTEMPTED',
  OTP_GENERATED: 'OTP_GENERATED',
  KYC_VERIFIED: 'KYC_VERIFIED',
  EMPLOYMENT_ELIGIBILITY_UPDATED: 'EMPLOYMENT_ELIGIBILITY_UPDATED',
} as const;

export type AuthEventType = (typeof AuthEventType)[keyof typeof AuthEventType];

// Auth Event Schemas
export const authEventSchemas = {
  [AuthEventType.USER_CREATED]: userSchema,
  [AuthEventType.USER_UPDATED]: z.object({
    userId: stringSchema.uuid,
    updates: z.record(z.unknown()),
    updatedAt: z.date(),
  }),
  [AuthEventType.USER_DELETED]: z.object({
    userId: stringSchema.uuid,
    deletedAt: z.date(),
  }),
  [AuthEventType.LOGIN_ATTEMPTED]: z.object({
    userId: stringSchema.uuid,
    success: z.boolean(),
    ip: stringSchema.nonEmpty,
    userAgent: stringSchema.nonEmpty,
    timestamp: z.date(),
  }),
  [AuthEventType.OTP_GENERATED]: z.object({
    userId: stringSchema.uuid,
    otpId: stringSchema.uuid,
    purpose: stringSchema.nonEmpty,
    expiresAt: z.date(),
    generatedAt: z.date(),
  }),
  [AuthEventType.KYC_VERIFIED]: z.object({
    userId: stringSchema.uuid,
    documentType: stringSchema.nonEmpty,
    verificationId: stringSchema.uuid,
    status: z.nativeEnum(KYCStatus),
    verifiedAt: z.date(),
    verifiedBy: stringSchema.nonEmpty,
  }),
  [AuthEventType.EMPLOYMENT_ELIGIBILITY_UPDATED]: z.object({
    userId: stringSchema.uuid,
    status: z.nativeEnum(EmploymentEligibilityStatus),
    updatedAt: z.date(),
    updatedBy: stringSchema.nonEmpty,
    reason: z.string().optional(),
  }),
} as const;

// Auth Event Data Types
export type AuthEventDataMap = {
  [K in AuthEventType]: z.infer<(typeof authEventSchemas)[K]>;
};

export interface UserCreatedEvent {
  type: 'USER_CREATED';
  data: {
    userId: string;
    email: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
  };
}

export interface KYCVerifiedEvent {
  type: 'KYC_VERIFIED';
  data: {
    userId: string;
    documentType: string;
    verificationId: string;
    status: KYCStatus;
    verifiedAt: Date;
    verifiedBy: string;
  };
}

export interface EmploymentEligibilityUpdatedEvent {
  type: 'EMPLOYMENT_ELIGIBILITY_UPDATED';
  data: {
    userId: string;
    status: EmploymentEligibilityStatus;
    updatedAt: Date;
    updatedBy: string;
    reason?: string;
  };
}

// Re-export all event types
export type AuthEvent = 
  | UserCreatedEvent
  | KYCVerifiedEvent
  | EmploymentEligibilityUpdatedEvent;
