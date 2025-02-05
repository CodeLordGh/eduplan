export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

export enum OTPStatus {
  PENDING = 'PENDING',
  USED = 'USED',
  EXPIRED = 'EXPIRED'
}

export enum OTPPurpose {
  REGISTRATION = 'REGISTRATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  STAFF_ONBOARDING = 'STAFF_ONBOARDING',
  STUDENT_LINKING = 'STUDENT_LINKING'
}

/**
 * Represents the possible states of a user's KYC verification
 */
export enum KYCStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

/**
 * Represents the possible states of a user's employment eligibility
 */
export enum EmploymentEligibilityStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  SUSPENDED = 'SUSPENDED'
} 