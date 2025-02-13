// Re-export everything from the generated client
export * from '../client';

// Factory function to create new PrismaClient instances
import { PrismaClient } from '../client';
export const prisma = new PrismaClient();
