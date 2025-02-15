import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { SecurityLayer, SecurityError, PolicyEvaluation, PolicyConditions } from './types';
import { validateAccess } from './abac';
import { verifyJWT, JWTPayload } from '../security';
import { createForbiddenError, createUnauthorizedError } from '../errors';
import {
  UserAttributes,
  ResourceAction,
  ValidationResult,
  KYCStatus,
  EmploymentEligibilityStatus,
  UserStatus,
  ExtendedRole
} from '@eduflow/types';
import { Role } from '@eduflow/prisma';

// Augment FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserAttributes;
  }
}

// Cache for policy evaluations
const policyCache = new Map<string, PolicyEvaluation>();

const generatePolicyCacheKey = (user: UserAttributes, policy: SecurityLayer['policies']): string => {
  return `${user.id}:${policy?.resource}:${policy?.action}:${JSON.stringify(policy?.conditions)}`;
};

const isPolicyExpired = (evaluation: PolicyEvaluation): boolean => {
  // Add cache expiration logic if needed
  return false;
};

const validateBasicAuth = async (
  request: FastifyRequest,
  config?: SecurityLayer['authentication']['basicAuth']
): Promise<PolicyEvaluation> => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        success: false,
        error: createUnauthorizedError('No authentication token provided', {
          code: 'NO_TOKEN',
        }) as SecurityError,
      };
    }

    const jwtPayload = verifyJWT(token);
    
    // Convert JWT payload to UserAttributes
    const user: UserAttributes = {
      id: jwtPayload.userId,
      email: jwtPayload.email,
      status: UserStatus.ACTIVE,
      globalRoles: [jwtPayload.role],
      schoolRoles: {},
      kyc: {
        status: KYCStatus.NOT_STARTED,
      },
      employment: {
        status: EmploymentEligibilityStatus.UNVERIFIED,
      },
      access: {
        failedAttempts: 0,
        mfaEnabled: false,
        mfaVerified: false,
      },
      context: {},
    };
    
    request.user = user;

    if (config?.roles && !config.roles.some(role => user.globalRoles.includes(role))) {
      return {
        success: false,
        error: createForbiddenError('Insufficient role', {
          code: 'INSUFFICIENT_ROLE',
          required: config.roles,
          current: user.globalRoles,
        }) as SecurityError,
      };
    }

    if (config?.permissions && !config.permissions.every(perm => jwtPayload.permissions.includes(perm))) {
      return {
        success: false,
        error: createForbiddenError('Insufficient permissions', {
          code: 'INSUFFICIENT_PERMISSIONS',
          required: config.permissions,
          current: jwtPayload.permissions,
        }) as SecurityError,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: createUnauthorizedError('Invalid authentication token', {
        code: 'INVALID_TOKEN',
        originalError: error,
      }) as SecurityError,
    };
  }
};

const evaluateABACPolicies = async (
  request: FastifyRequest,
  policies: SecurityLayer['policies']
): Promise<PolicyEvaluation> => {
  if (!policies || !request.user) {
    return { success: true };
  }

  const cacheKey = generatePolicyCacheKey(request.user, policies);
  const cached = policyCache.get(cacheKey);
  if (cached && !isPolicyExpired(cached)) {
    return cached;
  }

  const result = await validateAccess(request.user, {
    resource: policies.resource,
    action: policies.action as ResourceAction,
    conditions: policies.conditions || {},
  });

  const policyEvaluation: PolicyEvaluation = {
    success: result.granted,
    error: result.granted ? undefined : {
      type: 'POLICY',
      statusCode: 403,
      code: 'POLICY_VIOLATION',
      message: result.reason || 'Access denied by policy',
      name: 'PolicyError',
      context: {
        resource: policies.resource,
        action: policies.action,
      },
    } as SecurityError,
  };

  policyCache.set(cacheKey, policyEvaluation);
  return policyEvaluation;
};

const handleSecurityError = (error: SecurityError, reply: FastifyReply): void => {
  const { statusCode = 403, message, code, context } = error;
  
  reply.status(statusCode).send({
    error: {
      message,
      code,
      context,
    },
  });
};

export const createSecurityMiddleware = (config: SecurityLayer) => {
  return async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ): Promise<void> => {
    try {
      // 1. Basic Auth Check (Fast Path)
      if (config.authentication.required) {
        const authResult = await validateBasicAuth(request, config.authentication.basicAuth);
        if (!authResult.success && authResult.error) {
          throw authResult.error;
        }
      }

      // 2. ABAC Check (Only if policies exist)
      if (config.policies) {
        const policyResult = await evaluateABACPolicies(request, config.policies);
        if (!policyResult.success && policyResult.error) {
          throw policyResult.error;
        }
      }

      done();
    } catch (error) {
      handleSecurityError(error as SecurityError, reply);
    }
  };
};

// Factory Functions for Common Policies
export const createResourcePolicy = (
  resource: string,
  action: ResourceAction,
  basicAuth: SecurityLayer['authentication']['basicAuth'],
  conditions?: PolicyConditions
): SecurityLayer => ({
  authentication: {
    required: true,
    basicAuth,
  },
  policies: {
    resource,
    action,
    conditions,
  },
});

export const createAdminOnlyPolicy = (resource: string): SecurityLayer =>
  createResourcePolicy(resource, 'MANAGE' as ResourceAction, { roles: [Role.SYSTEM_ADMIN] });

export const createSchoolStaffPolicy = (resource: string, action: ResourceAction): SecurityLayer =>
  createResourcePolicy(
    resource,
    action,
    { roles: [Role.SCHOOL_ADMIN] },
    {
      school: {
        mustBeCurrentSchool: true,
      },
    }
  ); 