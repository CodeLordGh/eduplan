export enum DocumentType {
  IDENTITY = 'IDENTITY',
  SCHOOL_LICENSE = 'SCHOOL_LICENSE',
  EMPLOYMENT_PROOF = 'EMPLOYMENT_PROOF',
  QUALIFICATION = 'QUALIFICATION',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface KYCDocument {
  id: string;
  userId: string;
  type: DocumentType;
  status: VerificationStatus;
  documentUrls: string[];
  verifiedAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationHistory {
  id: string;
  entityId: string;
  entityType: 'USER' | 'SCHOOL';
  status: VerificationStatus;
  verifiedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCVerificationEvent {
  userId: string;
  documentId: string;
  status: VerificationStatus;
  type: DocumentType;
  verifiedBy?: string;
  timestamp: Date;
} 