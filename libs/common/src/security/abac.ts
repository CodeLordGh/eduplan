import * as E from 'fp-ts/Either';
import { 
  createForbiddenError, 
  throwError
} from '../errors';
import type {
  UserAttributes,
  AccessPolicy,
  ValidationResult,
  PolicyConditions,
  Role,
  AppError
} from '@eduflow/types';

// Error creation helpers
const createRoleError = (message: string, metadata: Record<string, any>): AppError => 
  createForbiddenError(message, {
    code: 'INSUFFICIENT_ROLES',
    ...metadata
  });

const createVerificationError = (message: string, metadata: Record<string, any>): AppError =>
  createForbiddenError(message, {
    code: 'VERIFICATION_REQUIRED',
    ...metadata
  });

const createSchoolContextError = (message: string, metadata: Record<string, any>): AppError =>
  createForbiddenError(message, {
    code: 'INVALID_SCHOOL_CONTEXT',
    ...metadata
  });

const createEnvironmentError = (message: string, metadata: Record<string, any>): AppError =>
  createForbiddenError(message, {
    code: 'ENVIRONMENT_RESTRICTION',
    ...metadata
  });

// Validation helper functions
const validateRoles = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<AppError, true> => {
  if (conditions.anyOf?.roles) {
    const hasAnyRole = conditions.anyOf.roles.some((role: Role) => 
      user.globalRoles.includes(role) || 
      Object.values(user.schoolRoles).some((roles: Role[]) => roles.includes(role))
    );
    if (!hasAnyRole) {
      return E.left(createRoleError('User does not have any of the required roles', {
        requiredRoles: conditions.anyOf.roles,
        userGlobalRoles: user.globalRoles,
        userSchoolRoles: user.schoolRoles
      }));
    }
  }

  if (conditions.allOf?.roles) {
    const hasAllRoles = conditions.allOf.roles.every((role: Role) =>
      user.globalRoles.includes(role) ||
      Object.values(user.schoolRoles).some((roles: Role[]) => roles.includes(role))
    );
    if (!hasAllRoles) {
      return E.left(createRoleError('User does not have all required roles', {
        requiredRoles: conditions.allOf.roles,
        userGlobalRoles: user.globalRoles,
        userSchoolRoles: user.schoolRoles
      }));
    }
  }

  return E.right(true);
};

const validateVerification = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<AppError, true> => {
  if (conditions.verification?.requireKYC && user.kyc.status !== 'VERIFIED') {
    return E.left(createVerificationError('KYC verification required', {
      currentKycStatus: user.kyc.status,
      requiredStatus: 'VERIFIED'
    }));
  }

  if (conditions.verification?.kycStatus && 
      !conditions.verification.kycStatus.includes(user.kyc.status)) {
    return E.left(createVerificationError(
      `Invalid KYC status. Required: ${conditions.verification.kycStatus.join(', ')}, Current: ${user.kyc.status}`,
      {
        requiredStatuses: conditions.verification.kycStatus,
        currentStatus: user.kyc.status
      }
    ));
  }

  if (conditions.verification?.employmentStatus &&
      !conditions.verification.employmentStatus.includes(user.employment.status)) {
    return E.left(createVerificationError(
      `Invalid employment status. Required: ${conditions.verification.employmentStatus.join(', ')}, Current: ${user.employment.status}`,
      {
        requiredStatuses: conditions.verification.employmentStatus,
        currentStatus: user.employment.status,
        verifiedAt: user.employment.verifiedAt,
        verifiedBy: user.employment.verifiedBy
      }
    ));
  }

  if (conditions.verification?.officerPermissions) {
    const hasPermissions = conditions.verification.officerPermissions.every(
      (permission: string) => user.kyc.officerStatus?.permissions && 
        permission in user.kyc.officerStatus.permissions && 
        user.kyc.officerStatus.permissions[permission as keyof typeof user.kyc.officerStatus.permissions]
    );
    if (!hasPermissions) {
      return E.left(createVerificationError(
        `Missing required KYC officer permissions: ${conditions.verification.officerPermissions.join(', ')}`,
        {
          requiredPermissions: conditions.verification.officerPermissions,
          currentPermissions: user.kyc.officerStatus?.permissions
        }
      ));
    }
  }

  return E.right(true);
};

const validateSchoolContext = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<AppError, true> => {
  if (!conditions.school) return E.right(true);

  const { mustBeInSchool, mustBeOwner, mustBeCurrentSchool, allowedRoles } = conditions.school;

  if (mustBeInSchool && Object.keys(user.schoolRoles).length === 0) {
    return E.left(createSchoolContextError('User must be associated with a school', {
      userId: user.id,
      schoolRoles: user.schoolRoles
    }));
  }

  if (mustBeCurrentSchool && !user.context.currentSchoolId) {
    return E.left(createSchoolContextError('No current school context', {
      userId: user.id,
      context: user.context
    }));
  }

  if (mustBeOwner) {
    const isOwner = Object.values(user.schoolRoles).some(
      (roles: Role[]) => roles.includes('SCHOOL_OWNER')
    );
    if (!isOwner) {
      return E.left(createSchoolContextError('User must be a school owner', {
        userId: user.id,
        schoolRoles: user.schoolRoles
      }));
    }
  }

  if (allowedRoles) {
    const hasAllowedRole = allowedRoles.some((role: Role) =>
      Object.values(user.schoolRoles).some((roles: Role[]) => roles.includes(role))
    );
    if (!hasAllowedRole) {
      return E.left(createSchoolContextError(
        `User does not have any of the allowed school roles: ${allowedRoles.join(', ')}`,
        {
          userId: user.id,
          allowedRoles,
          currentRoles: user.schoolRoles
        }
      ));
    }
  }

  return E.right(true);
};

const validateEnvironment = (
  user: UserAttributes,
  conditions: PolicyConditions
): E.Either<AppError, true> => {
  if (!conditions.environment) return E.right(true);

  const { ipRestrictions, timeRestrictions, deviceRestrictions, locationRestrictions } = conditions.environment;

  // IP restrictions
  if (ipRestrictions) {
    const userIp = user.context.location?.ip;
    if (!userIp) return E.left(createEnvironmentError('IP address not available', {
      userId: user.id,
      context: user.context
    }));

    if (ipRestrictions.allowlist && !ipRestrictions.allowlist.includes(userIp)) {
      return E.left(createEnvironmentError(`IP ${userIp} not in allowlist`, {
        userIp,
        allowlist: ipRestrictions.allowlist
      }));
    }
    if (ipRestrictions.denylist && ipRestrictions.denylist.includes(userIp)) {
      return E.left(createEnvironmentError(`IP ${userIp} is in denylist`, {
        userIp,
        denylist: ipRestrictions.denylist
      }));
    }
  }

  // Time restrictions
  if (timeRestrictions) {
    const userTimezone = user.context.location?.region || timeRestrictions.timezone;
    const now = new Date().toLocaleString('en-US', { timeZone: userTimezone });
    const currentDate = new Date(now);
    
    if (timeRestrictions.allowedDays && 
        !timeRestrictions.allowedDays.includes(currentDate.getDay().toString())) {
      return E.left(createEnvironmentError(
        `Access not allowed on ${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}`,
        {
          currentDay: currentDate.getDay(),
          allowedDays: timeRestrictions.allowedDays,
          timezone: userTimezone
        }
      ));
    }

    if (timeRestrictions.allowedHours) {
      const currentHour = currentDate.getHours();
      const [startHour, endHour] = timeRestrictions.allowedHours.map(Number);
      if (currentHour < startHour || currentHour > endHour) {
        return E.left(createEnvironmentError(
          `Access not allowed at ${currentDate.toLocaleTimeString()}. Allowed hours: ${startHour}:00-${endHour}:00`,
          {
            currentHour,
            allowedHours: timeRestrictions.allowedHours,
            timezone: userTimezone
          }
        ));
      }
    }
  }

  // Device restrictions
  if (deviceRestrictions) {
    const userDevice = user.context.deviceInfo?.type;
    if (!userDevice) return E.left(createEnvironmentError('Device information not available', {
      userId: user.id,
      context: user.context
    }));

    if (deviceRestrictions.allowedTypes && !deviceRestrictions.allowedTypes.includes(userDevice)) {
      return E.left(createEnvironmentError(
        `Device type ${userDevice} not allowed. Allowed types: ${deviceRestrictions.allowedTypes.join(', ')}`,
        {
          userDevice,
          allowedTypes: deviceRestrictions.allowedTypes
        }
      ));
    }
  }

  // Location restrictions
  if (locationRestrictions) {
    const userLocation = user.context.location;
    if (!userLocation) return E.left(createEnvironmentError('Location information not available', {
      userId: user.id,
      context: user.context
    }));

    if (locationRestrictions.countries && userLocation.country &&
        !locationRestrictions.countries.includes(userLocation.country)) {
      return E.left(createEnvironmentError(
        `Access not allowed from country: ${userLocation.country}`,
        {
          userCountry: userLocation.country,
          allowedCountries: locationRestrictions.countries
        }
      ));
    }

    if (locationRestrictions.regions && userLocation.region &&
        !locationRestrictions.regions.includes(userLocation.region)) {
      return E.left(createEnvironmentError(
        `Access not allowed from region: ${userLocation.region}`,
        {
          userRegion: userLocation.region,
          allowedRegions: locationRestrictions.regions
        }
      ));
    }
  }

  return E.right(true);
};

const validateCustomConditions = (
  user: UserAttributes,
  conditions: PolicyConditions,
  context: Record<string, any>
): E.Either<AppError, true> => {
  if (!conditions.custom) return E.right(true);

  for (const condition of conditions.custom) {
    if (!condition.evaluator(user, context)) {
      return E.left(createForbiddenError(condition.errorMessage, {
        code: 'CUSTOM_CONDITION_FAILED',
        userId: user.id,
        context
      }));
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
  try {
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
        reason: firstError.left.message
      };
    }

    return { granted: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      granted: false,
      reason: `Error evaluating access: ${errorMessage}`
    };
  }
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
        throwError(createForbiddenError(validationResult.reason || 'Access denied', {
          code: 'ACCESS_CHECK_ERROR',
          resource: policy.resource,
          action: policy.action,
          userId: req.userAttributes.id,
          conditions: policy.conditions
        }));
      }

      next();
    } catch (error) {
      if (error instanceof Error) {
        next(createForbiddenError('Access check failed', {
          code: 'ACCESS_CHECK_ERROR',
          resource: policy.resource,
          action: policy.action,
          userId: req.userAttributes?.id,
          error: error.message,
          conditions: policy.conditions
        }));
      } else {
        next(error);
      }
    }
  }; 