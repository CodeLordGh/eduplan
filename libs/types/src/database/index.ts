import type { PrismaClient as BasePrismaClient } from '@eduflow/prisma';
import type { Profile as PrismaProfile } from '@eduflow/prisma';

// Create a more specific PrismaClient type with any business logic extensions we need
export type PrismaClient = BasePrismaClient;

// Re-export the Profile type from Prisma
export type Profile = PrismaProfile;

// Export other database types here...
