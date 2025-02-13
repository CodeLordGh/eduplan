import { Role, Permission, ROLE_HIERARCHY, ROLE_PERMISSIONS } from './roles';
import { KYCStatus, EmploymentEligibilityStatus } from './status';
import {
  UserAttributes,
  UserContext,
  PolicyConditions,
  AccessPolicy,
  ValidationResult,
} from './abac';

/**
 * Collects all required user attributes for access evaluation
 */
export const collectUserAttributes = async (userId: string): Promise<UserAttributes> => {
  // Implementation would integrate with your user service, KYC service, etc.
  throw new Error('Not implemented - integrate with your services');
};

/**
 * Checks if user roles satisfy the required roles based on role hierarchy
 */
export const checkRoleHierarchy = (userRoles: Role[], requiredRoles: Role[]): boolean => {
  return requiredRoles.some((required) =>
    userRoles.some(
      (userRole) => ROLE_HIERARCHY[userRole].includes(required) || userRole === required
    )
  );
};

/**
 * Verifies if user has all required permissions based on their roles
 */
export const checkPermissions = (userRoles: Role[], requiredPermissions: Permission[]): boolean => {
  const userPermissions = userRoles.flatMap((role) => ROLE_PERMISSIONS[role]);
  return requiredPermissions.every((permission) => userPermissions.includes(permission));
};

/**
 * Validates if the current time is within allowed time restrictions
 */
export const isWithinAllowedTime = (
  allowedDays: string[],
  allowedHours: string[],
  timezone: string
): boolean => {
  const now = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDay = days[now.getDay()];

  if (!allowedDays.includes(currentDay)) {
    return false;
  }

  // Convert current time to specified timezone
  const options = { timeZone: timezone };
  const timeStr = now.toLocaleTimeString('en-US', options);
  const currentHour = parseInt(timeStr.split(':')[0]);

  return allowedHours.some((range) => {
    const [start, end] = range.split('-').map((t) => parseInt(t));
    return currentHour >= start && currentHour < end;
  });
};

/**
 * Checks if an IP is allowed based on allowlist/denylist
 */
export const isIPAllowed = (
  ip: string | undefined,
  allowlist?: string[],
  denylist?: string[]
): boolean => {
  if (!ip) return false;
  if (denylist?.includes(ip)) return false;
  if (allowlist?.length && !allowlist.includes(ip)) return false;
  return true;
};

/**
 * Verifies if a device is trusted based on device info
 */
export const isTrustedDevice = (deviceInfo: UserContext['deviceInfo']): boolean => {
  if (!deviceInfo) return false;
  // Implement your device trust logic here
  return true;
};

/**
 * Validates the user's context against policy conditions
 */
export const validateContext = (
  context: UserContext,
  conditions: PolicyConditions
): ValidationResult => {
  // School context
  if (conditions.school?.mustBeCurrentSchool && !context.currentSchoolId) {
    return { granted: false, reason: 'Invalid school context - no current school' };
  }

  if (conditions.school?.mustBeInSchool && !context.currentSchoolId) {
    return { granted: false, reason: 'Invalid school context - must be in a school' };
  }

  // Time restrictions
  if (conditions.environment?.timeRestrictions) {
    const { allowedDays, allowedHours, timezone } = conditions.environment.timeRestrictions;
    if (!isWithinAllowedTime(allowedDays, allowedHours, timezone)) {
      return { granted: false, reason: 'Outside allowed time' };
    }
  }

  return { granted: true };
};

/**
 * Checks environmental conditions (IP, device, location)
 */
export const checkEnvironment = (
  context: UserContext,
  conditions: PolicyConditions
): ValidationResult => {
  const { environment } = conditions;

  // IP check
  if (environment?.ipRestrictions) {
    const { allowlist, denylist } = environment.ipRestrictions;
    if (!isIPAllowed(context.location?.ip, allowlist, denylist)) {
      return { granted: false, reason: 'IP not allowed' };
    }
  }

  // Device check
  if (environment?.deviceRestrictions?.requireTrusted && !isTrustedDevice(context.deviceInfo)) {
    return { granted: false, reason: 'Untrusted device' };
  }

  // Location check
  if (environment?.locationRestrictions) {
    const { countries, regions } = environment.locationRestrictions;
    if (countries?.length && !countries.includes(context.location?.country || '')) {
      return { granted: false, reason: 'Country not allowed' };
    }
    if (regions?.length && !regions.includes(context.location?.region || '')) {
      return { granted: false, reason: 'Region not allowed' };
    }
  }

  return { granted: true };
};

/**
 * Verifies user's KYC and employment status
 */
export const checkVerification = (
  attributes: UserAttributes,
  conditions: PolicyConditions
): ValidationResult => {
  const { verification } = conditions;

  if (verification?.requireKYC && !verification.kycStatus?.includes(attributes.kyc.status)) {
    return { granted: false, reason: 'KYC verification required' };
  }

  if (
    verification?.employmentStatus &&
    !verification.employmentStatus.includes(attributes.employment.status)
  ) {
    return { granted: false, reason: 'Employment verification required' };
  }

  if (verification?.officerPermissions?.length) {
    const hasPermissions = verification.officerPermissions.every(
      (permission) =>
        attributes.kyc.officerStatus?.permissions[
          permission as keyof typeof attributes.kyc.officerStatus.permissions
        ]
    );
    if (!hasPermissions) {
      return { granted: false, reason: 'Missing officer permissions' };
    }
  }

  return { granted: true };
};

/**
 * Main ABAC evaluation function
 */
export const evaluateAccess = async (
  userId: string,
  policy: AccessPolicy
): Promise<ValidationResult> => {
  try {
    // Collect attributes
    const attributes = await collectUserAttributes(userId);

    // Check role hierarchy
    if (
      policy.conditions.anyOf?.roles &&
      !checkRoleHierarchy(attributes.globalRoles, policy.conditions.anyOf.roles)
    ) {
      return { granted: false, reason: 'Insufficient role' };
    }

    // Check permissions
    if (
      policy.conditions.allOf?.permissions &&
      !checkPermissions(attributes.globalRoles, policy.conditions.allOf.permissions)
    ) {
      return { granted: false, reason: 'Missing required permissions' };
    }

    // Check context
    const contextResult = validateContext(attributes.context, policy.conditions);
    if (!contextResult.granted) return contextResult;

    // Check environment
    const envResult = checkEnvironment(attributes.context, policy.conditions);
    if (!envResult.granted) return envResult;

    // Check verification
    const verificationResult = checkVerification(attributes, policy.conditions);
    if (!verificationResult.granted) return verificationResult;

    // Run custom evaluators
    if (policy.conditions.custom) {
      for (const { evaluator, errorMessage } of policy.conditions.custom) {
        if (!evaluator(attributes, policy.conditions)) {
          return { granted: false, reason: errorMessage };
        }
      }
    }

    return { granted: true };
  } catch (error) {
    return {
      granted: false,
      reason: `Error evaluating access: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
