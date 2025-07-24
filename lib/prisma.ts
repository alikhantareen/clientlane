import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with Vercel-optimized settings
const createPrismaClient = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Vercel-specific optimizations
    ...(process.env.NODE_ENV === 'production' && {
      log: ['error', 'warn'],
    }),
  })

  return client
}

// Use global instance in development, create new in production (Vercel)
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Vercel-specific: Don't disconnect on beforeExit as it can cause issues
if (process.env.NODE_ENV !== 'production') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
} 