import { Role } from './roles';
import { UserStatus } from './status';

export interface AuthEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp?: Date;
}

export interface UserCreatedEvent {
  userId: string;
  email: string;
  role: Role;
  createdAt: Date;
}

export interface UserUpdatedEvent {
  userId: string;
  updates: {
    email?: string;
    role?: Role;
    status?: UserStatus;
  };
}

export interface UserDeletedEvent {
  userId: string;
}

export interface LoginAttemptEvent {
  userId: string;
  success: boolean;
  ip: string;
  userAgent: string;
}

export interface OTPGeneratedEvent {
  userId: string;
  otpId: string;
  expiresAt: Date;
}

// Events consumed from other services
export interface KYCVerifiedEvent {
  userId: string;
  documentType: string;
  verificationId: string;
}

export interface KYCRejectedEvent {
  userId: string;
  reason: string;
}

export interface EmploymentEligibilityUpdatedEvent {
  userId: string;
  status: 'ELIGIBLE' | 'INELIGIBLE';
  reason?: string;
}

export interface KYCStatusChangedEvent {
  userId: string;
  status: string;
  verificationId?: string;
}

export interface EmploymentStatusChangedEvent {
  userId: string;
  status: string;
  reason?: string;
}

export interface SocialAccessChangedEvent {
  userId: string;
  enabled: boolean;
  reason: string;
} 