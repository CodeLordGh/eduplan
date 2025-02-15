// Re-export everything from the generated client
export * from '../client';

// Export a factory function to create new PrismaClient instances
import { PrismaClient } from '../client';

// Export the PrismaClient class
export { PrismaClient };

// Export a singleton instance for general use
export const prisma = new PrismaClient();
