import { z } from 'zod';
import { Role, UserStatus } from '@eduflow/prisma';
import { stringSchema } from '../validation';
import { userSchema } from './schema';

// Auth Event Types
export const AuthEventType = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  LOGIN_ATTEMPTED: 'LOGIN_ATTEMPTED',
  OTP_GENERATED: 'OTP_GENERATED',
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
} as const;

// Auth Event Data Types
export type AuthEventDataMap = {
  [K in AuthEventType]: z.infer<(typeof authEventSchemas)[K]>;
};
