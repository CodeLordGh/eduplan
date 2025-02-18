// Core auth types
// export * from './types'; // Removed because the module does not exist

// Role and permission types
export * from './roles';
export * from './status';

// Event types and schemas
export * from './events';

// Constants and configuration
export * from './constants';

// Access control types
export type {
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
  UserAttributes,
  ExtendedRole,
} from './abac';

// User management types
export * from './user';

// Validation types
export type { Email, Password, LoginCredentials, Registration } from './validation';
