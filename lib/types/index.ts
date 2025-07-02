// Common types used throughout the application

import { User, UserRole } from '../generated/prisma'

// Re-export Prisma types
export type { User, UserRole } from '../generated/prisma'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: UserRole
  isVerified: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  username?: string
  firstName?: string
  lastName?: string
}

// Session types
export interface Session {
  user: AuthUser
  expires: string
}

// Form types
export interface FormError {
  field: string
  message: string
}

export interface FormState<T = any> {
  data: T
  errors: FormError[]
  isLoading: boolean
  isSubmitting: boolean
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface PageProps {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Table/List types
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

export interface FilterOption {
  field: string
  value: any
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
}

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredNonNull<T> = {
  [P in keyof T]-?: NonNullable<T[P]>
}

// Database types
export interface DatabaseError {
  code: string
  message: string
  field?: string
}

// Upload types
export interface UploadedFile {
  id: string
  name: string
  url: string
  size: number
  type: string
}

// Navigation types
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<any>
  children?: NavItem[]
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Status types
export type Status = 'idle' | 'loading' | 'success' | 'error'

// Common enum-like types
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
} as const

export type UserRoleType = typeof USER_ROLES[keyof typeof USER_ROLES] 