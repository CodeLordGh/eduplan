import { Role, UserStatus } from '@eduflow/prisma';
import { KYCStatus } from '../auth/status';

/**
 * All Event Types
 */
export const EventType = {
  // Auth Events
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  LOGIN_ATTEMPTED: 'LOGIN_ATTEMPTED',
  OTP_GENERATED: 'OTP_GENERATED',

  // KYC Events
  KYC_SUBMITTED: 'KYC_SUBMITTED',
  KYC_VERIFIED: 'KYC_VERIFIED',
  KYC_REJECTED: 'KYC_REJECTED',
  SCHOOL_VERIFIED: 'SCHOOL_VERIFIED',
  EMPLOYMENT_ELIGIBILITY_UPDATED: 'EMPLOYMENT_ELIGIBILITY_UPDATED',

  // School Events
  SCHOOL_CREATED: 'SCHOOL_CREATED',
  SCHOOL_UPDATED: 'SCHOOL_UPDATED',
  CLASS_CREATED: 'CLASS_CREATED',
  STAFF_ASSIGNED: 'STAFF_ASSIGNED',

  // Academic Events
  GRADE_RECORDED: 'GRADE_RECORDED',
  ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
  PERFORMANCE_UPDATED: 'PERFORMANCE_UPDATED',

  // Payment Events
  PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INVOICE_GENERATED: 'INVOICE_GENERATED',

  // Notification Events
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',

  // Social Events
  POST_CREATED: 'POST_CREATED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  REACTION_ADDED: 'REACTION_ADDED',
  CONNECTION_REQUESTED: 'CONNECTION_REQUESTED',
  CONNECTION_UPDATED: 'CONNECTION_UPDATED',

  // Chat Events
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
  MESSAGE_READ: 'MESSAGE_READ',
  CHAT_CREATED: 'CHAT_CREATED',
  PARTICIPANT_ADDED: 'PARTICIPANT_ADDED',

  // AI Events
  AI_PREDICTION_GENERATED: 'AI_PREDICTION_GENERATED',
  LEARNING_PATH_CREATED: 'LEARNING_PATH_CREATED',

  // File Events
  FILE_UPLOADED: 'FILE_UPLOADED',
  FILE_DELETED: 'FILE_DELETED',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

/**
 * Event metadata interface
 */
export interface EventMetadata {
  version: string;
  source: string;
  correlationId: string;
  timestamp: string;
  schemaVersion: string;
}

/**
 * Base event interface
 */
export interface Event<T> {
  type: EventType;
  data: T;
  metadata: EventMetadata;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: Event<T>) => Promise<void>;

// Domain-specific event data types
export interface AuthEventData {
  USER_CREATED: {
    userId: string;
    email: string;
    role: Role;
    status: UserStatus;
    createdAt: Date;
  };
  USER_UPDATED: {
    userId: string;
    updates: Record<string, unknown>;
    updatedAt: Date;
  };
  USER_DELETED: {
    userId: string;
    deletedAt: Date;
  };
  // ... other auth event data types
}

export interface KYCEventData {
  KYC_VERIFIED: {
    userId: string;
    documentType: string;
    verificationId: string;
    status: KYCStatus;
    verifiedAt: Date;
  };
  // ... other KYC event data types
}

// Combined event data map type with proper index signature
export type EventDataMap = {
  [K in EventType]: K extends keyof AuthEventData 
    ? AuthEventData[K] 
    : K extends keyof KYCEventData 
    ? KYCEventData[K] 
    : never;
};

/**
 * Type helper for creating specific event types
 */
export type TypedEvent<T extends EventType> = Event<EventDataMap[T]>;
