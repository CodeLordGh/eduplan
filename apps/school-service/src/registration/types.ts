import { ResourceAction, KYCStatus, VerificationStatus } from '@eduflow/types';
import { Logger } from '@eduflow/logger';

export interface OperationContext {
  requestId: string;
  userId: string;
  clientInfo: ClientInfo;
  logger: Logger;
  operationType?: string;
}

export interface EventContext extends OperationContext {
  eventId: string;
  timestamp: Date;
  source: string;
}

export interface ClientInfo {
  ip: string;
  userAgent: string;
}

export interface SchoolInfo {
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  type: SchoolType;
}

export interface OwnerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  kycStatus: KYCStatus;
}

export interface RegistrationEvent {
  type: 'REGISTRATION_INITIATED';
  data: {
    schoolInfo: SchoolInfo;
    ownerInfo: OwnerInfo;
    context: {
      requestId: string;
      clientInfo: ClientInfo;
      abacDecision: {
        granted: boolean;
        evaluatedAt: Date;
        policies: string[];
      };
    };
  };
}

export interface VerificationEvent {
  type: 'VERIFICATION_STATUS_CHANGED';
  data: {
    schoolId: string;
    ownerId: string;
    previousStatus: VerificationStatus;
    newStatus: VerificationStatus;
    verifiedBy: string;
    context: {
      requestId: string;
      abacContext: AbacContext;
    };
  };
}

export interface AbacContext {
  evaluatedPolicies: string[];
  accessDecision: boolean;
  evaluatedAt: Date;
}

export enum SchoolType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
  VOCATIONAL = 'VOCATIONAL'
}

export type SchoolRegistrationResult = {
  schoolId: string;
  ownerId: string;
  status: VerificationStatus;
  createdAt: Date;
};

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