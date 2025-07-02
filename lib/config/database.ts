// Database configuration
export const databaseConfig = {
  url: process.env.DATABASE_URL!,
  
  // Connection pool settings for production
  pool: {
    min: 2,
    max: 10,
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