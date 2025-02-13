# Unified Security System Architecture

## Overview

This document outlines the integration of Authentication (Auth) and Attribute-Based Access Control (ABAC) into a unified security system while maintaining their distinct benefits.

## Unified Architecture

### 1. Security Layer Interface
```typescript
interface SecurityLayer {
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

interface PolicyConditions {
  verification?: {
    requireKYC?: boolean;
    kycStatus?: KYCStatus[];
    employmentStatus?: EmploymentEligibilityStatus[];
  };
  environment?: {
    timeRestrictions?: TimeRestriction;
    ipRestrictions?: IpRestriction;
  };
  school?: SchoolContext;
  custom?: Record<string, unknown>;
}
```

### 2. Unified Security Middleware
```typescript
const createSecurityMiddleware = (config: SecurityLayer) => 
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      // 1. Basic Auth Check (Fast Path)
      if (config.authentication.required) {
        const authResult = await validateBasicAuth(
          request, 
          config.authentication.basicAuth
        );
        if (!authResult.success) {
          throw createAuthError(authResult.error);
        }
      }

      // 2. ABAC Check (Only if policies exist)
      if (config.policies) {
        const policyResult = await evaluateABACPolicies(
          request,
          config.policies
        );
        if (!policyResult.success) {
          throw createPolicyError(policyResult.error);
        }
      }

      next();
    } catch (error) {
      handleSecurityError(error, response);
    }
  };
```

## Integration Benefits

1. **Performance Optimization**
   - Fast path for basic auth checks
   - Lazy loading of ABAC policies
   - Cached policy evaluation
   - Parallel validation when possible

2. **Developer Experience**
   - Single configuration interface
   - Clear security requirements
   - Type-safe policy creation
   - Consistent error handling

3. **Security Features**
   - Defense in depth maintained
   - Clear security boundaries
   - Audit logging
   - Policy versioning

## Implementation Example

```typescript
// Example: School Settings Access
const schoolSettingsPolicy: SecurityLayer = {
  authentication: {
    required: true,
    basicAuth: {
      roles: ['SCHOOL_STAFF']
    }
  },
  policies: {
    resource: 'school-settings',
    action: 'UPDATE',
    conditions: {
      verification: {
        requireKYC: true,
        kycStatus: [KYCStatus.VERIFIED]
      },
      school: {
        mustBeCurrentSchool: true
      }
    }
  }
};

// Usage
app.put('/api/school/settings', 
  createSecurityMiddleware(schoolSettingsPolicy),
  handleSchoolSettings
);
```

## Factory Functions

```typescript
// Policy Creation
export const createResourcePolicy = (
  resource: string,
  action: string,
  basicAuth: BasicAuthConfig,
  conditions?: PolicyConditions
): SecurityLayer => ({
  authentication: {
    required: true,
    basicAuth
  },
  policies: {
    resource,
    action,
    conditions
  }
});

// Common Policies
export const createAdminOnlyPolicy = (resource: string) => 
  createResourcePolicy(
    resource,
    'MANAGE',
    { roles: ['ADMIN'] }
  );

export const createSchoolStaffPolicy = (
  resource: string,
  action: string
) => createResourcePolicy(
  resource,
  action,
  { roles: ['SCHOOL_STAFF'] },
  {
    school: {
      mustBeCurrentSchool: true
    }
  }
);
```

## Error Handling Integration

```typescript
interface SecurityError extends AppError {
  type: 'AUTH' | 'POLICY';
  context: {
    resource?: string;
    action?: string;
    failedConditions?: string[];
  };
}

const handleSecurityError = (
  error: SecurityError,
  response: Response
) => {
  // 1. Log error with context
  logger.error('Security check failed', {
    type: error.type,
    context: error.context
  });

  // 2. Send appropriate response
  response.status(error.statusCode).json({
    error: {
      message: error.message,
      code: error.code,
      context: error.context
    }
  });
};
```

## Performance Optimizations

1. **Policy Caching**
```typescript
const policyCache = new Map<string, PolicyEvaluation>();

const evaluateABACPolicies = async (
  request: Request,
  policies: PolicyConfig
) => {
  const cacheKey = generatePolicyCacheKey(request, policies);
  
  // Check cache first
  const cached = policyCache.get(cacheKey);
  if (cached && !isPolicyExpired(cached)) {
    return cached;
  }

  // Evaluate and cache
  const result = await evaluatePolicies(request, policies);
  policyCache.set(cacheKey, result);
  return result;
};
```

2. **Parallel Validation**
```typescript
const validateConditions = async (
  conditions: PolicyConditions
) => {
  const validations = [
    validateRoles(conditions),
    validateVerification(conditions),
    validateEnvironment(conditions)
  ];

  const results = await Promise.all(validations);
  return results.every(result => result.success);
};
```

## Migration Strategy

1. **Phase 1: Interface Unification**
   - Create unified interfaces
   - Keep existing implementations
   - Add adapter layer

2. **Phase 2: Gradual Migration**
   - Convert simple auth routes first
   - Add ABAC policies incrementally
   - Maintain backward compatibility

3. **Phase 3: Performance Optimization**
   - Implement caching
   - Add parallel validation
   - Optimize policy evaluation

4. **Phase 4: Legacy Cleanup**
   - Remove old implementations
   - Update documentation
   - Migrate remaining routes 