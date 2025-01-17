import { UserRole } from './roles';
import { UserStatus, KYCStatus, EmploymentEligibilityStatus } from './status';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  kycStatus: KYCStatus;
  kycVerifiedAt: Date | null;
  kycDocumentIds: string[];
  employmentStatus: EmploymentEligibilityStatus;
  employmentVerifiedAt: Date | null;
  employmentDocumentIds: string[];
  socialAccessEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
