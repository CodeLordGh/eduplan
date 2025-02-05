export * from './roles';
export * from './status';
export * from './user';
// export * from './abac';

export type {
  UserAttributes,
  AccessPolicy,
  ValidationResult,
  PolicyConditions,
  ResourceAction,
  SchoolRole,
  KYCOfficerStatus,
  UserKYC,
  UserEmployment,
  TimeRestrictions,
  UserAccess,
  UserContext
} from './abac';

export * from './constants';
export * from './validation';

// Re-export types from validation for backward compatibility
export type {
  Email,
  Password,
  LoginCredentials,
  RegistrationData
} from './validation';