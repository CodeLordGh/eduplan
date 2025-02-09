/**
 * ABAC (Attribute-Based Access Control) type definitions
 * @see ./ABAC.md for detailed documentation
 */

import { Role, Permission } from './roles';
import { KYCStatus, EmploymentEligibilityStatus } from './status';

/** Allowed actions on resources */
export type ResourceAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

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
    teacherDocuments: boolean;
    parentDocuments: boolean;
    schoolOwnerDocuments: boolean;
    approvalAuthority: boolean;
    gracePeriodManagement: boolean;
  };
  specializations: string[];
  workload: number;
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
  socialEnabled: boolean;
  hubAccess: {
    type: 'HUB' | 'B_HUB';
    permissions: string[];
  };
  restrictions: {
    ipWhitelist?: string[];
    allowedCountries?: string[];
    allowedDevices?: string[];
    timeRestrictions?: TimeRestrictions;
  };
  gracePeriod?: {
    type: string;
    startDate: Date;
    endDate: Date;
    status: string;
  };
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

/** Complete set of user attributes for access decisions */
export interface UserAttributes {
  id: string;
  email: string;
  status: string;
  globalRoles: Role[];
  schoolRoles: Record<string, Role[]>;
  kyc: {
    status: KYCStatus;
    officerStatus?: {
      permissions: {
        canVerifyIdentity: boolean;
        canVerifyDocuments: boolean;
        canApproveKYC: boolean;
      };
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