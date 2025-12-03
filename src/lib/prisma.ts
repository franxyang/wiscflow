// Mocking PrismaClient because it is not generated in this environment.
// This allows the app to build and run using mock data fallbacks.

/*
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
*/

// Mock implementation that returns empty results
export const prisma = {
  course: {
    findMany: async (...args: any[]) => {
      return [];
    },
    findFirst: async (...args: any[]) => {
      return null;
    }
  }
};
