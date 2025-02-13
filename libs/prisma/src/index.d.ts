import { PrismaClient } from '@prisma/client';
export * from '.prisma/client';
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
  ParentStudentRelation,
} from '.prisma/client';
export {
  Role,
  UserStatus,
  VerificationStatus,
  DocumentType,
  EntityType,
  OTPStatus,
  EmploymentEligibilityStatus,
  GradeStatus,
  ReportCardStatus,
} from '.prisma/client';
export type { Prisma } from '.prisma/client';
export declare const prisma: PrismaClient<
  import('@prisma/client').Prisma.PrismaClientOptions,
  never,
  import('@prisma/client/runtime/library').DefaultArgs
>;
//# sourceMappingURL=index.d.ts.map
