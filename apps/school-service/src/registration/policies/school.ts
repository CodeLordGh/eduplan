import { AccessPolicy, ResourceAction, KYCStatus, EmploymentEligibilityStatus, UserAttributes, PolicyConditions } from '@eduflow/types';
import { createPolicy } from '@eduflow/common';
import { hasValidSubscription } from '../utils';

export const createSchoolRegistrationPolicy = (
  action: ResourceAction
): AccessPolicy => createPolicy('school', action, {
  anyOf: {
    roles: ['SYSTEM_ADMIN', 'SCHOOL_ADMIN']
  },
  verification: {
    requireKYC: true,
    kycStatus: [KYCStatus.VERIFIED],
    employmentStatus: [EmploymentEligibilityStatus.ELIGIBLE]
  },
  environment: {
    timeRestrictions: {
      allowedDays: process.env.BUSINESS_DAYS?.split(',') || ['1', '2', '3', '4', '5'],
      allowedHours: [
        process.env.BUSINESS_HOURS_START || '09',
        process.env.BUSINESS_HOURS_END || '17'
      ],
      timezone: process.env.BUSINESS_TIMEZONE || 'UTC'
    },
    ipRestrictions: {
      allowlist: process.env.ALLOWED_IPS?.split(',')
    }
  }
});

export const createSchoolOwnerPolicy = (
  schoolId: string
): AccessPolicy => createPolicy('school', 'UPDATE', {
  school: {
    mustBeOwner: true,
    mustBeCurrentSchool: true
  },
  verification: {
    requireKYC: true,
    kycStatus: [KYCStatus.VERIFIED]
  },
  custom: [
    {
      evaluator: (attributes: UserAttributes, _conditions: PolicyConditions) => hasValidSubscription(attributes, schoolId),
      errorMessage: 'Active subscription required'
    }
  ]
});

export const createVerificationPolicy = (
  schoolId: string
): AccessPolicy => createPolicy('school', 'UPDATE', {
  anyOf: {
    roles: ['SYSTEM_ADMIN', 'KYC_OFFICER']
  },
  verification: {
    requireKYC: true,
    kycStatus: [KYCStatus.VERIFIED]
  },
  environment: {
    timeRestrictions: {
      allowedDays: process.env.BUSINESS_DAYS?.split(',') || ['1', '2', '3', '4', '5'],
      allowedHours: [
        process.env.BUSINESS_HOURS_START || '09',
        process.env.BUSINESS_HOURS_END || '17'
      ],
      timezone: process.env.BUSINESS_TIMEZONE || 'UTC'
    }
  },
  custom: [
    {
      evaluator: (attributes: UserAttributes, _conditions: PolicyConditions) => !attributes.schoolRoles[schoolId],
      errorMessage: 'No conflicts of interest allowed'
    }
  ]
}); 