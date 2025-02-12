import {
  EmploymentEligibilityStatus,
  UserAttributes,
  AccessPolicy,
  KYCStatus,
  PolicyConditions,
} from '@eduflow/types';
import { createPolicy } from './abac';

// School Management Policies
export const updateSchoolSettingsPolicy = createPolicy('school-settings', 'UPDATE', {
  anyOf: {
    roles: ['SCHOOL_OWNER', 'SCHOOL_HEAD'],
  },
  verification: {
    requireKYC: true,
    kycStatus: [KYCStatus.VERIFIED],
    employmentStatus: [EmploymentEligibilityStatus.ELIGIBLE],
  },
  school: {
    mustBeCurrentSchool: true,
  },
  environment: {
    ipRestrictions: {
      allowlist: ['${school.allowedIPs}'],
    },
  },
});

// KYC Management Policies
export const verifyKycDocumentPolicy = createPolicy('kyc-document', 'UPDATE', {
  anyOf: {
    roles: ['SYSTEM_ADMIN'],
  },
  verification: {
    officerPermissions: ['approvalAuthority'],
  },
  environment: {
    timeRestrictions: {
      allowedDays: ['1', '2', '3', '4', '5'], // Monday to Friday
      allowedHours: ['09', '17'], // 9 AM to 5 PM
      timezone: 'UTC',
    },
  },
});

// Academic Policies
export const viewStudentGradesPolicy = createPolicy('grades', 'READ', {
  anyOf: {
    roles: ['TEACHER', 'SCHOOL_HEAD', 'PARENT'],
  },
  custom: [
    {
      evaluator: (user, context) => {
        if (user.globalRoles.includes('TEACHER')) {
          return isTeacherOfStudent(user, context);
        }
        if (user.globalRoles.includes('PARENT')) {
          return isParentOfStudent(user, context);
        }
        return true;
      },
      errorMessage: "You do not have permission to view this student's grades",
    },
  ],
});

// Salary Management Policies
export const updateSalaryStructurePolicy = createPolicy('salary-structure', 'UPDATE', {
  anyOf: {
    roles: ['SCHOOL_OWNER', 'SCHOOL_HEAD'],
  },
  verification: {
    requireKYC: true,
    kycStatus: [KYCStatus.VERIFIED],
    employmentStatus: [EmploymentEligibilityStatus.ELIGIBLE],
  },
  school: {
    mustBeInSchool: true,
    mustBeCurrentSchool: true,
  },
  environment: {
    timeRestrictions: {
      allowedDays: ['1', '2', '3', '4', '5'],
      allowedHours: ['09', '17'],
      timezone: 'UTC',
    },
  },
});

// Social Platform Policies
export const createBHubPostPolicy = createPolicy('b-hub-post', 'CREATE', {
  anyOf: {
    roles: ['SCHOOL_OWNER', 'SCHOOL_HEAD'],
  },
  verification: {
    requireKYC: true,
    kycStatus: [KYCStatus.VERIFIED],
  },
  school: {
    mustBeInSchool: true,
  },
});

// Helper functions for custom evaluators
const isTeacherOfStudent = (user: UserAttributes, context: PolicyConditions): boolean => {
  const studentSchoolId = user.context.currentSchoolId;
  if (!studentSchoolId) return false;

  // Check if user is a teacher in the student's school
  return user.schoolRoles[studentSchoolId]?.includes('TEACHER') || false;
};

const isParentOfStudent = (user: UserAttributes, context: PolicyConditions): boolean => {
  const studentSchoolId = user.context.currentSchoolId;
  if (!studentSchoolId) return false;

  // Check if user is a parent in the student's school
  return user.schoolRoles[studentSchoolId]?.includes('PARENT') || false;
};

export const createKYCPolicy = (action: AccessPolicy['action']): AccessPolicy => ({
  resource: 'kyc',
  action,
  conditions: {
    verification: {
      requireKYC: true,
      kycStatus: [KYCStatus.VERIFIED as const],
    },
  },
});

export const createDocumentPolicy = (action: AccessPolicy['action']): AccessPolicy => ({
  resource: 'document',
  action,
  conditions: {
    verification: {
      requireKYC: true,
      kycStatus: [KYCStatus.VERIFIED as const],
    },
  },
});

export const createSchoolPolicy = (action: AccessPolicy['action']): AccessPolicy => ({
  resource: 'school',
  action,
  conditions: {
    verification: {
      requireKYC: true,
      kycStatus: [KYCStatus.VERIFIED as const],
    },
    school: {
      mustBeOwner: true,
    },
  },
});

// Update student-related policies to use custom evaluators
const createStudentPolicy = (action: AccessPolicy['action']): AccessPolicy => ({
  resource: 'student',
  action,
  conditions: {
    verification: {
      requireKYC: true,
    },
    school: {
      mustBeCurrentSchool: true,
    },
    custom: [
      {
        evaluator: (user: UserAttributes) => {
          const currentSchoolId = user.context.currentSchoolId;
          if (!currentSchoolId) return false;

          if (user.globalRoles.includes('TEACHER')) {
            const schoolRoles = user.schoolRoles[currentSchoolId];
            return schoolRoles ? schoolRoles.includes('TEACHER') : false;
          }
          if (user.globalRoles.includes('PARENT')) {
            const schoolRoles = user.schoolRoles[currentSchoolId];
            return schoolRoles ? schoolRoles.includes('PARENT') : false;
          }
          return false;
        },
        errorMessage: "Must be a teacher or parent in the student's school",
      },
    ],
  },
});

export const createEmploymentPolicy = (action: AccessPolicy['action']): AccessPolicy => ({
  resource: 'employment',
  action,
  conditions: {
    verification: {
      requireKYC: true,
      employmentStatus: [EmploymentEligibilityStatus.ELIGIBLE, EmploymentEligibilityStatus.PENDING],
    },
    custom: [
      {
        evaluator: (user: UserAttributes) => {
          // Custom employment policy logic
          return true;
        },
        errorMessage: 'Custom employment policy check failed',
      },
    ],
  },
});
