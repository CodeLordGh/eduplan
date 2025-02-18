/**
 * ABAC (Attribute-Based Access Control) type definitions
 * @see ./ABAC.md for detailed documentation
 */

import { Role, Permission } from './roles';
import { KYCStatus, EmploymentEligibilityStatus } from './status';
import { ExtendedRole, AcademicContext } from './roles';

export { ExtendedRole };

/** Allowed actions on resources */
export type ResourceAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'PROCESS';

/** School-specific role configuration */
export interface SchoolRole {
  roles: Role[];
  permissions: Permission[];
  communicationPermissions: string[];
  assignedBy: string;
  createdAt: Date;
}

/** KYC officer status and permissions */
export interface KYCOfficerStatus {
  isOfficer: boolean;
  permissions: {
    canVerifyIdentity: boolean;
    canVerifyDocuments: boolean;
    canVerifyEmployment: boolean;
  };
  assignedBy: string;
  assignedAt: Date;
}

/** User's KYC verification status and details */
export interface UserKYC {
  status: KYCStatus;
  verifiedAt?: Date;
  documentIds: string[];
  officerStatus?: KYCOfficerStatus;
}

/** User's employment verification status */
export interface UserEmployment {
  status: EmploymentEligibilityStatus;
  verifiedAt?: Date;
  documentIds: string[];
  currentSchools: string[];
}

/** Time-based access restrictions */
export interface TimeRestrictions {
  allowedDays: string[];
  allowedHours: string[];
  timezone: string;
}

/** User's access configuration and restrictions */
export interface UserAccess {
  lastLogin?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  socialEnabled?: boolean;
  lastPasswordChange?: Date;
  passwordExpiresAt?: Date;
  ipRestrictions?: IPRestrictions;
  deviceRestrictions?: DeviceRestrictions;
  timeRestrictions?: TimeRestrictions;
}

/** Current user context for access decisions */
export interface UserContext {
  currentSchoolId?: string;
  location?: {
    ip?: string;
    country?: string;
    region?: string;
  };
  deviceInfo?: {
    id: string;
    type: string;
    trustScore: number;
    lastVerified: Date;
  };
}

/** User's attributes and permissions */
export interface UserAttributes {
  id: string;
  email: string;
  status: string;
  globalRoles: Role[];
  schoolRoles: Record<string, ExtendedRole>;
  academicProfile?: AcademicContext;
  kyc: {
    status: KYCStatus;
    officerStatus?: {
      permissions: {
        canVerifyIdentity: boolean;
        canVerifyDocuments: boolean;
        canVerifyEmployment: boolean;
      };
      assignedBy: string;
      assignedAt: Date;
    };
  };
  employment: {
    status: EmploymentEligibilityStatus;
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  access: {
    lastLogin?: Date;
    failedAttempts: number;
    lockedUntil?: Date;
    mfaEnabled: boolean;
    mfaVerified: boolean;
  };
  context: UserContext;
  subscriptions?: Subscription[];
}

/** Conditions that must be met for access */
export interface PolicyConditions {
  anyOf?: {
    roles?: Role[];
    permissions?: Permission[];
  };
  allOf?: {
    roles?: Role[];
    permissions?: Permission[];
  };
  school?: {
    mustBeInSchool?: boolean;
    mustBeOwner?: boolean;
    mustBeCurrentSchool?: boolean;
    allowedRoles?: Role[];
  };
  academic?: AcademicContext & {
    requiredRoles?: string[];
  };
  environment?: {
    ipRestrictions?: {
      allowlist?: string[];
      denylist?: string[];
    };
    timeRestrictions?: TimeRestrictions;
    deviceRestrictions?: {
      requireTrusted: boolean;
      minTrustScore?: number;
      allowedTypes?: string[];
    };
    locationRestrictions?: {
      countries?: string[];
      regions?: string[];
    };
  };
  verification?: {
    requireKYC?: boolean;
    kycStatus?: KYCStatus[];
    employmentStatus?: EmploymentEligibilityStatus[];
    officerPermissions?: string[];
  };
  custom?: Array<{
    evaluator: (attributes: UserAttributes, conditions: PolicyConditions) => boolean;
    errorMessage: string;
  }>;
}

/** Access policy definition */
export interface AccessPolicy {
  resource: string;
  action: ResourceAction;
  conditions: PolicyConditions;
}

/** Result of access policy evaluation */
export interface ValidationResult {
  granted: boolean;
  reason?: string;
}

export interface IPRestrictions {
  allowlist?: string[];
  denylist?: string[];
}

export interface LocationRestrictions {
  countries?: string[];
  regions?: string[];
}

export interface DeviceRestrictions {
  requireTrusted: boolean;
  minTrustScore?: number;
  allowedTypes?: string[];
}

export interface SchoolConditions {
  mustBeInSchool?: boolean;
  mustBeOwner?: boolean;
  mustBeCurrentSchool?: boolean;
  allowedRoles?: Role[];
}

export interface EnvironmentConditions {
  timeRestrictions?: TimeRestrictions;
  ipRestrictions?: IPRestrictions;
  locationRestrictions?: LocationRestrictions;
  deviceRestrictions?: DeviceRestrictions;
}

export interface VerificationConditions {
  requireKYC?: boolean;
  kycStatus?: KYCStatus[];
  employmentStatus?: EmploymentEligibilityStatus[];
  officerPermissions?: string[];
}

export interface CustomEvaluator {
  evaluator: (attributes: UserAttributes, conditions: PolicyConditions) => boolean;
  errorMessage: string;
}

export interface Subscription {
  schoolId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}
