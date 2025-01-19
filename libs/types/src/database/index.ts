import type { PrismaClient as BasePrismaClient, Profile } from '@eduflow/prisma';

// Re-export the Profile type
export type { Profile } from '@eduflow/prisma';

// Create a more specific PrismaClient type
export type PrismaClient = BasePrismaClient & {
  profile: BasePrismaClient['profile'];
  user: BasePrismaClient['user'];
  oTP: BasePrismaClient['oTP'];
  refreshToken: BasePrismaClient['refreshToken'];
  kYCDocument: BasePrismaClient['kYCDocument'];
  verificationHistory: BasePrismaClient['verificationHistory'];
  school: BasePrismaClient['school'];
  staffAssignment: BasePrismaClient['staffAssignment'];
  classSubject: BasePrismaClient['classSubject'];
  class: BasePrismaClient['class'];
  classStudent: BasePrismaClient['classStudent'];
  reportCard: BasePrismaClient['reportCard'];
  grade: BasePrismaClient['grade'];
  studentProfile: BasePrismaClient['studentProfile'];
  parentProfile: BasePrismaClient['parentProfile'];
  attendance: BasePrismaClient['attendance'];
  staffProfile: BasePrismaClient['staffProfile'];
  subject: BasePrismaClient['subject'];
  subjectAssignment: BasePrismaClient['subjectAssignment'];
  communicationGroup: BasePrismaClient['communicationGroup'];
  schoolRole: BasePrismaClient['schoolRole'];
}; 