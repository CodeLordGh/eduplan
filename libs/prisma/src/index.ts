import { PrismaClient } from '@prisma/client';

// Re-export everything from the generated Prisma client
export * from '.prisma/client';

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
} from '.prisma/client';

// Export enums as both types and values
export { Role, UserStatus, VerificationStatus, DocumentType, EntityType, OTPStatus, EmploymentEligibilityStatus, GradeStatus, ReportCardStatus } from '.prisma/client';

// Export Prisma namespace for input types
export type { Prisma } from '.prisma/client';

// Export the Prisma client instance
export const prisma = new PrismaClient(); 