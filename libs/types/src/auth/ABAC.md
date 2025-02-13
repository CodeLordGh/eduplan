# Attribute-Based Access Control (ABAC) System

## Overview

The ABAC system provides fine-grained access control based on user attributes, resource characteristics, and environmental conditions. It allows for complex access policies that can consider multiple factors when determining access rights.

## Core Components

### User Attributes (`UserAttributes`)

Represents all attributes associated with a user that can influence access decisions:

- Basic info (id, email, status)
- Roles (global and school-specific)
- KYC status and verification
- Employment status
- Access restrictions and permissions
- Contextual information

### Access Policy (`AccessPolicy`)

Defines rules for accessing resources:

- Resource identifier
- Action type (CREATE, READ, UPDATE, DELETE)
- Conditions that must be met

### Policy Conditions (`PolicyConditions`)

Complex conditions that can be combined to form access rules:

1. **Role-Based Conditions**

   - `anyOf`: Match any of the specified roles
   - `allOf`: Must match all specified roles/permissions

2. **Verification Requirements**

   - KYC status checks
   - Employment status verification
   - Officer permissions

3. **School Context**

   - School membership requirements
   - Owner/role requirements
   - Current school context

4. **Environmental Restrictions**

   - IP restrictions
   - Time-based access
   - Device restrictions
   - Location-based access

5. **Custom Evaluators**
   - Custom logic for complex scenarios
   - Custom error messages

## Usage Example

```typescript
const policy: AccessPolicy = {
  resource: 'school.finances',
  action: 'READ',
  conditions: {
    anyOf: {
      roles: ['SCHOOL_OWNER', 'SCHOOL_ADMIN'],
    },
    verification: {
      requireKYC: true,
      kycStatus: ['VERIFIED'],
    },
    school: {
      mustBeCurrentSchool: true,
    },
    environment: {
      timeRestrictions: {
        allowedDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        allowedHours: ['09:00-17:00'],
        timezone: 'UTC',
      },
    },
  },
};
```

## Special Features

### Grace Period

The system supports grace periods for users who temporarily need elevated access or are in the process of completing verification requirements.

### KYC Officer System

Special handling for KYC officers with:

- Document verification permissions
- Workload management
- Specialization tracking

### Time-Based Access

Granular control over when users can access resources:

- Day-of-week restrictions
- Time-of-day restrictions
- Timezone awareness

### Location-Based Access

Control access based on:

- IP whitelisting
- Country restrictions
- Regional restrictions

## Best Practices

1. **Layer Policies**

   - Start with broad role-based rules
   - Add specific attribute requirements
   - Include environmental constraints last

2. **Use Custom Evaluators Sparingly**

   - Prefer built-in conditions when possible
   - Document custom evaluators thoroughly
   - Include clear error messages

3. **Consider Performance**

   - Cache user attributes when possible
   - Evaluate simple conditions first
   - Use appropriate index for role lookups

4. **Security Considerations**
   - Always verify KYC status for sensitive operations
   - Implement proper IP and device tracking
   - Log access policy evaluations
   - Regular audit of custom evaluators

## Error Handling

The system provides detailed validation results:

- Boolean access grant status
- Reason for denial when applicable
- Custom error messages from evaluators
