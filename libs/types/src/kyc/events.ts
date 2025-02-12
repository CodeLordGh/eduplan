import { z } from 'zod';
import { stringSchema } from '../validation';

// KYC Event Types
export const KYCEventType = {
  KYC_VERIFIED: 'KYC_VERIFIED',
  KYC_REJECTED: 'KYC_REJECTED',
  EMPLOYMENT_ELIGIBILITY_UPDATED: 'EMPLOYMENT_ELIGIBILITY_UPDATED',
} as const;

export type KYCEventType = (typeof KYCEventType)[keyof typeof KYCEventType];

// KYC Event Schemas
export const kycEventSchemas = {
  [KYCEventType.KYC_VERIFIED]: z.object({
    userId: stringSchema.uuid,
    documentType: stringSchema.nonEmpty,
    verificationId: stringSchema.nonEmpty,
    verifiedAt: z.date(),
  }),
  [KYCEventType.KYC_REJECTED]: z.object({
    userId: stringSchema.uuid,
    reason: stringSchema.nonEmpty,
    rejectedAt: z.date(),
  }),
  [KYCEventType.EMPLOYMENT_ELIGIBILITY_UPDATED]: z.object({
    userId: stringSchema.uuid,
    status: z.enum(['ELIGIBLE', 'INELIGIBLE']),
    reason: z.string().optional(),
    updatedAt: z.date(),
  }),
} as const;

// KYC Event Data Types
export type KYCEventDataMap = {
  [K in KYCEventType]: z.infer<(typeof kycEventSchemas)[K]>;
};
