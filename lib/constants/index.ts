// Application constants and configuration

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  USERS: {
    LIST: '/api/users',
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/update',
    DELETE: '/api/users/delete',
  },
} as const

// App Routes
export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/(protected)/dashboard',
  PROFILE: '/(protected)/profile',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const

// Form validation constants
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

// File upload constants
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
} as const

// Session constants
export const SESSION = {
  COOKIE_NAME: 'session',
  MAX_AGE: 7 * 24 * 60 * 60, // 7 days in seconds
  REFRESH_THRESHOLD: 24 * 60 * 60, // 1 day in seconds
} as const

// Rate limiting constants
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MINUTES: 15,
  },
  API_REQUESTS: {
    MAX_REQUESTS: 100,
    WINDOW_MINUTES: 15,
  },
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MINUTES: 60,
  },
} as const

// Application metadata
export const APP_METADATA = {
  NAME: 'Your App',
  DESCRIPTION: 'A modern Next.js application with authentication and dashboard',
  VERSION: '1.0.0',
  AUTHOR: 'Your Team',
  KEYWORDS: ['nextjs', 'react', 'typescript', 'prisma', 'postgresql'],
} as const

// Environment constants
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

// Status constants
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// User role constants
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const

// Database constants
export const DATABASE = {
  CONNECTION_TIMEOUT: 10000, // 10 seconds
  QUERY_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
} as const

// Cache constants
export const CACHE = {
  USER_SESSION: 'user_session',
  API_RESPONSES: 'api_responses',
  STATIC_DATA: 'static_data',
  TTL: {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 30 * 60, // 30 minutes
    LONG: 24 * 60 * 60, // 24 hours
  },
} as const

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful! Welcome back.',
  REGISTER: 'Registration successful! Please verify your email.',
  LOGOUT: 'Logout successful. See you next time!',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  EMAIL_SENT: 'Email sent successfully.',
} as const 