import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with production optimizations
const createPrismaClient = () => {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      log: ['error', 'warn'],
    }),
  })

  // Add connection error handling
  client.$connect()
    .then(() => {
      console.log('Database connected successfully')
    })
    .catch((error) => {
      console.error('Database connection failed:', error)
    })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
}) 