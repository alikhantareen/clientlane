import { prisma } from '@/lib/prisma'

/**
 * Execute a database operation with proper error handling and connection management
 */
export async function withDatabaseOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error('Database operation failed:', error)
    
    // Handle connection pool errors
    if (error.code === 'P2037') {
      console.error('Connection pool exhausted, attempting to reconnect...')
      try {
        await prisma.$disconnect()
        await prisma.$connect()
        // Retry the operation once
        return await operation()
      } catch (retryError) {
        console.error('Retry failed:', retryError)
        if (fallback !== undefined) {
          return fallback
        }
        throw retryError
      }
    }
    
    if (fallback !== undefined) {
      return fallback
    }
    throw error
  }
}

/**
 * Batch multiple database operations in a single transaction
 */
export async function batchDatabaseOperations<T>(
  operations: (() => Promise<T>)[]
): Promise<T[]> {
  return await prisma.$transaction(async (tx) => {
    const results: T[] = []
    for (const operation of operations) {
      results.push(await operation())
    }
    return results
  })
}

/**
 * Execute database operations with connection pooling optimization
 */
export async function optimizedDatabaseQuery<T>(
  query: () => Promise<T>,
  options: {
    timeout?: number
    retries?: number
    fallback?: T
  } = {}
): Promise<T> {
  const { timeout = 30000, retries = 1, fallback } = options
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), timeout)
      })
      
      const result = await Promise.race([query(), timeoutPromise])
      return result
    } catch (error: any) {
      console.error(`Database query attempt ${attempt + 1} failed:`, error)
      
      if (attempt === retries) {
        if (fallback !== undefined) {
          return fallback
        }
        throw error
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
  
  throw new Error('All database query attempts failed')
}

/**
 * Execute multiple database queries with connection pooling and batching
 */
export async function executeBatchedQueries<T>(
  queries: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(query => withDatabaseOperation(query))
    )
    results.push(...batchResults)
    
    // Small delay between batches to prevent connection exhaustion
    if (i + batchSize < queries.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

/**
 * Monitor database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Get database connection metrics (if available)
 */
export async function getConnectionMetrics() {
  try {
    // This is a basic health check - in production you might want more detailed metrics
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime
    
    return {
      isConnected: true,
      responseTime,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
} 

export async function cleanupExpiredTokens() {
  try {
    const result = await prisma.passwordResetToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { used: true }
        ]
      }
    });
    console.log(`🧹 Cleaned up ${result.count} expired/used password reset tokens`);
    return result.count;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
} 