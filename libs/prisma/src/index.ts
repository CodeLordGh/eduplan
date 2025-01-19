import { PrismaClient } from '../client';

// Re-export everything from the generated Prisma client
export * from '../client';

// Export specific types that are needed across the application
export type {
  User,
  KYCDocument,
  School,
  StaffAssignment,
  ClassSubject,
  Class,
  ClassStudent,
  ReportCard,
  Grade,
  OTP,
  RefreshToken,
  VerificationHistory,
  ParentStudentRelation
} from '../client';

// Export enums as both types and values
export { Role, UserStatus, VerificationStatus, DocumentType, EntityType, OTPStatus, EmploymentEligibilityStatus, GradeStatus, ReportCardStatus } from '../client';

// Export Prisma namespace for input types
export type { Prisma } from '../client';

// Export the Prisma client instance
export const prisma = new PrismaClient(); 