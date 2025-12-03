// Stub class to satisfy type checking when actual Prisma Client is not generated
class PrismaClient {
  course = {
    findMany: async (args?: any) => [],
    findFirst: async (args?: any) => null
  }
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;