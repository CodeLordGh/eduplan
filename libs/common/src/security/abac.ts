import * as E from 'fp-ts/Either';
import { createError } from '../errors';
import type {
  UserAttributes,
  AccessPolicy,
  ValidationResult,
  PolicyConditions,
  Role,
  SchoolRole
} from '@eduflow/types';

// Validation helper functions
const validateRoles = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<string, true> => {
  if (conditions.anyOf?.roles) {
    const hasAnyRole = conditions.anyOf.roles.some((role: Role) => 
      user.globalRoles.includes(role) || 
      Array.from(user.schoolRoles.values()).some((sr: SchoolRole) => sr.roles.includes(role))
    );
    if (!hasAnyRole) {
      return E.left('User does not have any of the required roles');
    }
  }

  if (conditions.allOf?.roles) {
    const hasAllRoles = conditions.allOf.roles.every((role: Role) =>
      user.globalRoles.includes(role) ||
      Array.from(user.schoolRoles.values()).some((sr: SchoolRole) => sr.roles.includes(role))
    );
    if (!hasAllRoles) {
      return E.left('User does not have all required roles');
    }
  }

  return E.right(true);
};

const validateVerification = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<string, true> => {
  if (conditions.verification?.requireKYC && user.kyc.status !== 'VERIFIED') {
    return E.left('KYC verification required');
  }

  if (conditions.verification?.kycStatus && 
      !conditions.verification.kycStatus.includes(user.kyc.status)) {
    return E.left('Invalid KYC status');
  }

  if (conditions.verification?.employmentStatus &&
      !conditions.verification.employmentStatus.includes(user.employment.status)) {
    return E.left('Invalid employment status');
  }

  if (conditions.verification?.officerPermissions) {
    const hasPermissions = conditions.verification.officerPermissions.every(
      (permission: string) => user.kyc.officerStatus?.permissions && 
        permission in user.kyc.officerStatus.permissions && 
        user.kyc.officerStatus.permissions[permission as keyof typeof user.kyc.officerStatus.permissions]
    );
    if (!hasPermissions) {
      return E.left('Missing required KYC officer permissions');
    }
  }

  return E.right(true);
};

const validateSchoolContext = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<string, true> => {
  if (!conditions.school) return E.right(true);

  const { mustBeInSchool, mustBeOwner, mustBeCurrentSchool, allowedRoles } = conditions.school;

  if (mustBeInSchool && user.schoolRoles.size === 0) {
    return E.left('User must be associated with a school');
  }

  if (mustBeCurrentSchool && !user.context.currentSchoolId) {
    return E.left('No current school context');
  }

  if (mustBeOwner) {
    const isOwner = Array.from(user.schoolRoles.values()).some(
      (sr: SchoolRole) => sr.roles.includes('SCHOOL_OWNER')
    );
    if (!isOwner) {
      return E.left('User must be a school owner');
    }
  }

  if (allowedRoles) {
    const hasAllowedRole = allowedRoles.some((role: Role) =>
      Array.from(user.schoolRoles.values()).some((sr: SchoolRole) => sr.roles.includes(role))
    );
    if (!hasAllowedRole) {
      return E.left('User does not have any of the allowed school roles');
    }
  }

  return E.right(true);
};

const validateEnvironment = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<string, true> => {
  if (!conditions.environment) return E.right(true);

  const { ipRestrictions, timeRestrictions, deviceRestrictions, locationRestrictions } = conditions.environment;

  // IP restrictions
  if (ipRestrictions) {
    const userIp = user.context.location?.ip;
    if (!userIp) return E.left('IP address not available');

    if (ipRestrictions.allowlist && !ipRestrictions.allowlist.includes(userIp)) {
      return E.left('IP not in allowlist');
    }
    if (ipRestrictions.denylist && ipRestrictions.denylist.includes(userIp)) {
      return E.left('IP in denylist');
    }
  }

  // Time restrictions
  if (timeRestrictions) {
    const userTimezone = user.context.location?.region || timeRestrictions.timezone;
    const now = new Date().toLocaleString('en-US', { timeZone: userTimezone });
    const currentDate = new Date(now);
    
    if (timeRestrictions.allowedDays && 
        !timeRestrictions.allowedDays.includes(currentDate.getDay().toString())) {
      return E.left('Access not allowed on this day');
    }

    if (timeRestrictions.allowedHours) {
      const currentHour = currentDate.getHours();
      const [startHour, endHour] = timeRestrictions.allowedHours.map(Number);
      if (currentHour < startHour || currentHour > endHour) {
        return E.left('Access not allowed during these hours');
      }
    }
  }

  // Device restrictions
  if (deviceRestrictions) {
    const userDevice = user.context.deviceInfo?.type;
    if (!userDevice) return E.left('Device information not available');

    if (deviceRestrictions.types && !deviceRestrictions.types.includes(userDevice)) {
      return E.left('Device type not allowed');
    }
  }

  // Location restrictions
  if (locationRestrictions) {
    const userLocation = user.context.location;
    if (!userLocation) return E.left('Location information not available');

    if (locationRestrictions.countries && 
        !locationRestrictions.countries.includes(userLocation.country)) {
      return E.left('Access not allowed from this country');
    }

    if (locationRestrictions.regions && 
        !locationRestrictions.regions.includes(userLocation.region)) {
      return E.left('Access not allowed from this region');
    }
  }

  return E.right(true);
};

const validateCustomConditions = (
  user: UserAttributes,
  conditions: PolicyConditions,
  context: Record<string, any>
): E.Either<string, true> => {
  if (!conditions.custom) return E.right(true);

  for (const condition of conditions.custom) {
    if (!condition.evaluator(user, context)) {
      return E.left(condition.errorMessage);
    }
  }

  return E.right(true);
};

// Main validation function
export const validateAccess = (
  user: UserAttributes,
  policy: AccessPolicy,
  context: Record<string, any> = {}
): ValidationResult => {
  const validationResults = [
    validateRoles(user, policy.conditions),
    validateVerification(user, policy.conditions),
    validateSchoolContext(user, policy.conditions),
    validateEnvironment(user, policy.conditions),
    validateCustomConditions(user, policy.conditions, context)
  ];

  const firstError = validationResults.find(E.isLeft);
  if (firstError && E.isLeft(firstError)) {
    return {
      granted: false,
      reason: firstError.left
    };
  }

  return { granted: true };
};

// Policy management functions
export const createPolicy = (
  resource: string,
  action: AccessPolicy['action'],
  conditions: PolicyConditions
): AccessPolicy => ({
  resource,
  action,
  conditions
});

// Middleware factory
export const createAbacMiddleware = (policy: AccessPolicy) => 
  async (req: any, res: any, next: any): Promise<void> => {
    try {
      const validationResult = validateAccess(
        req.userAttributes,
        policy,
        {
          params: req.params,
          query: req.query,
          body: req.body
        }
      );

      if (!validationResult.granted) {
        throw createError(
          validationResult.reason || 'Access denied',
          'FORBIDDEN',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  }; 