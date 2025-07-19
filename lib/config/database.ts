// Database configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL!,
  
  // Connection pool settings for production
  pool: {
    min: process.env.NODE_ENV === 'production' ? 1 : 2,
    max: process.env.NODE_ENV === 'production' ? 20 : 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  
  // Query logging in development
  logging: process.env.NODE_ENV === 'development',
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
}

// Validate required environment variables
export function validateDatabaseConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }
}

// Helper to check database connection status
export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL
}

// Get connection pool settings based on environment
export function getConnectionPoolSettings() {
  if (process.env.NODE_ENV === 'production') {
    return {
      min: 1,
      max: 20,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  }
  
  return {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  }
} 