import { Role, Permission, KYCStatus, EmploymentEligibilityStatus, UserAttributes } from '@eduflow/types';

export interface SecurityLayer {
  // Core Authentication
  authentication: {
    required: boolean;
    basicAuth?: {
      roles?: Role[];
      permissions?: Permission[];
    };
  };

  // ABAC Policies (Optional)
  policies?: {
    resource: string;
    action: string;
    conditions?: PolicyConditions;
  };
}

export interface TimeRestrictions {
  allowedDays: string[];
  allowedHours: string[];
  timezone: string;
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
    ipRestrictions?: IPRestrictions;
    timeRestrictions?: TimeRestrictions;
    deviceRestrictions?: DeviceRestrictions;
    locationRestrictions?: LocationRestrictions;
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

export interface SecurityError extends Error {
  type: 'AUTH' | 'POLICY';
  statusCode: number;
  code: string;
  context: {
    resource?: string;
    action?: string;
    failedConditions?: string[];
  };
}

export interface PolicyEvaluation {
  success: boolean;
  error?: SecurityError;
} 