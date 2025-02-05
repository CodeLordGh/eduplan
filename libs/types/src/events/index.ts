import { Role } from '../auth/roles';
import { UserStatus } from '../auth/status';
import { User } from '../auth';

// Base event interface
export interface Event<T = unknown> {
  type: string;
  data: T;
  metadata: {
    version: string;
    source: string;
    correlationId: string;
    timestamp: string;
    schemaVersion: string;
  };
}

// Auth Events
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

export interface UserUpdatedEvent {
  type: 'USER_UPDATED';
  data: {
    userId: string;
    updates: Partial<User>;
    updatedAt: Date;
  };
}

export interface UserDeletedEvent {
  type: 'USER_DELETED';
  data: {
    userId: string;
    deletedAt: Date;
  };
}

export interface LoginAttemptedEvent {
  type: 'LOGIN_ATTEMPTED';
  data: {
    userId: string;
    success: boolean;
    ip: string;
    userAgent: string;
    timestamp: Date;
  };
}

export interface OTPGeneratedEvent {
  type: 'OTP_GENERATED';
  data: {
    userId: string;
    otpId: string;
    purpose: string;
    expiresAt: Date;
    generatedAt: Date;
  };
}

// Events consumed from other services
export interface KYCVerifiedEvent {
  type: 'KYC_VERIFIED';
  data: {
    userId: string;
    documentType: string;
    verificationId: string;
    verifiedAt: Date;
  };
}

export interface KYCRejectedEvent {
  type: 'KYC_REJECTED';
  data: {
    userId: string;
    reason: string;
    rejectedAt: Date;
  };
}

export interface EmploymentEligibilityUpdatedEvent {
  type: 'EMPLOYMENT_ELIGIBILITY_UPDATED';
  data: {
    userId: string;
    status: 'ELIGIBLE' | 'INELIGIBLE';
    reason?: string;
    updatedAt: Date;
  };
}

// Event type unions
export type AuthEvent = 
  | UserCreatedEvent
  | UserUpdatedEvent
  | UserDeletedEvent
  | LoginAttemptedEvent
  | OTPGeneratedEvent;

export type ConsumedAuthEvent =
  | KYCVerifiedEvent
  | KYCRejectedEvent
  | EmploymentEligibilityUpdatedEvent;

// Re-export event type constants
export { EVENT_TYPES, EventType } from './constants'; 