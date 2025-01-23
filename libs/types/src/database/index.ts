import type { PrismaClient as BasePrismaClient } from '@eduflow/prisma';

// Create a more specific PrismaClient type with any business logic extensions we need
export type PrismaClient = BasePrismaClient; 