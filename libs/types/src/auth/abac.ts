import { Role, Permission } from './roles';
import { KYCStatus, EmploymentEligibilityStatus } from './status';

export type ResourceAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface SchoolRole {
  roles: Role[];
  permissions: Permission[];
  communicationPermissions: string[];
  assignedBy: string;
  createdAt: Date;
}

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

export interface UserKYC {
  status: KYCStatus;
  verifiedAt?: Date;
  documentIds: string[];
  officerStatus?: KYCOfficerStatus;
}

export interface UserEmployment {
  status: EmploymentEligibilityStatus;
  verifiedAt?: Date;
  documentIds: string[];
  currentSchools: string[];
}

export interface TimeRestrictions {
  allowedDays: string[];
  allowedHours: string[];
  timezone: string;
}

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

export interface UserContext {
  currentSchoolId?: string;
  currentRole?: Role;
  deviceInfo?: {
    id: string;
    type: string;
    lastUsed: Date;
  };
  location?: {
    ip: string;
    country: string;
    region: string;
  };
}

export interface UserAttributes {
  id: string;
  email: string;
  status: string;
  globalRoles: Role[];
  schoolRoles: Map<string, SchoolRole>;
  kyc: UserKYC;
  employment: UserEmployment;
  access: UserAccess;
  context: UserContext;
}

export interface PolicyConditions {
  anyOf?: {
    roles?: Role[];
    globalRoles?: Role[];
    schoolRoles?: Role[];
  };
  allOf?: {
    roles?: Role[];
    permissions?: Permission[];
  };
  verification?: {
    requireKYC?: boolean;
    kycStatus?: KYCStatus[];
    employmentStatus?: EmploymentEligibilityStatus[];
    officerPermissions?: string[];
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
      types?: string[];
      requireTrusted?: boolean;
    };
    locationRestrictions?: {
      countries?: string[];
      regions?: string[];
    };
  };
  custom?: Array<{
    evaluator: (attributes: UserAttributes, context: any) => boolean;
    errorMessage: string;
  }>;
}

export interface AccessPolicy {
  resource: string;
  action: ResourceAction;
  conditions: PolicyConditions;
}

export interface ValidationResult {
  granted: boolean;
  reason?: string;
} 