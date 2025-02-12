import {
  UserAttributes,
  KYCStatus,
  EmploymentEligibilityStatus,
  Role,
  UserContext,
  KYCOfficerStatus,
} from '@eduflow/types';
import { Prisma } from '@eduflow/prisma';

// Base user type from Prisma with includes
export type UserWithIncludes = Prisma.UserGetPayload<{
  include: {
    profile: true;
    documents: true;
    verifications: true;
  };
}> & {
  roles: Role[];
  permissions: string[];
};

// Request context type for enriching user attributes
export interface RequestContext {
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

// Transform functions for each ABAC component
export const transformKYCAttributes = (user: UserWithIncludes) => ({
  status: (user.kycStatus || KYCStatus.NOT_STARTED) as KYCStatus,
  verifiedAt: user.kycVerifiedAt || undefined,
  documentIds: user.kycDocumentIds || [],
  officerStatus: user.roles.includes('KYC_OFFICER')
    ? {
        permissions: {
          canVerifyIdentity: true,
          canVerifyDocuments: true,
          canApproveKYC: user.roles.includes('SYSTEM_ADMIN'),
        },
      }
    : undefined,
});

export const transformEmploymentAttributes = (user: UserWithIncludes) => ({
  status: (user.employmentStatus ||
    EmploymentEligibilityStatus.UNVERIFIED) as EmploymentEligibilityStatus,
  verifiedAt: user.employmentVerifiedAt || undefined,
  verifiedBy: user.verifications?.[0]?.id,
  documentIds: user.employmentDocumentIds || [],
  currentSchools: [], // Will be populated by school service
});

export const transformAccessAttributes = async (
  userId: string,
  getAccessData: (userId: string) => Promise<any>
) => {
  const accessData = await getAccessData(userId);

  return {
    failedAttempts: accessData.failedAttempts || 0,
    lastLogin: accessData.lastLogin,
    lockedUntil: accessData.lockedUntil,
    socialEnabled: accessData.socialEnabled || false,
    restrictions: {
      ipWhitelist: accessData.ipWhitelist,
      allowedCountries: accessData.allowedCountries,
      timeRestrictions: accessData.timeRestrictions,
    },
  };
};

export const transformContextAttributes = async (
  user: UserWithIncludes,
  requestContext?: RequestContext,
  getCurrentSchoolId?: (userId: string) => Promise<string | undefined>
): Promise<UserContext> => ({
  currentSchoolId: getCurrentSchoolId ? await getCurrentSchoolId(user.id) : undefined,
  location: requestContext?.location,
  deviceInfo: requestContext?.deviceInfo
    ? {
        id: requestContext.deviceInfo.id,
        type: requestContext.deviceInfo.type,
        trustScore: requestContext.deviceInfo.trustScore || 0,
        lastVerified: requestContext.deviceInfo.lastVerified || new Date(),
      }
    : undefined,
});

export const transformToUserAttributes = async (
  user: UserWithIncludes,
  options: {
    requestContext?: RequestContext;
    getAccessData?: (userId: string) => Promise<any>;
    getCurrentSchoolId?: (userId: string) => Promise<string | undefined>;
    getSchoolRoles?: (userId: string) => Promise<Record<string, Role[]>>;
  } = {}
): Promise<UserAttributes> => {
  const {
    requestContext,
    getAccessData = async () => ({}),
    getCurrentSchoolId = async () => undefined,
    getSchoolRoles = async () => ({}),
  } = options;

  const [accessAttributes, contextAttributes, schoolRoles] = await Promise.all([
    transformAccessAttributes(user.id, getAccessData),
    transformContextAttributes(user, requestContext, getCurrentSchoolId),
    getSchoolRoles(user.id),
  ]);

  return {
    id: user.id,
    email: user.email || '',
    status: user.status,
    globalRoles: user.roles as Role[],
    schoolRoles,
    kyc: transformKYCAttributes(user),
    employment: transformEmploymentAttributes(user),
    access: accessAttributes,
    context: contextAttributes,
  };
};
