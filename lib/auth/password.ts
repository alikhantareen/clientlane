// Password utility functions
// Note: Install bcryptjs with: npm install bcryptjs @types/bcryptjs
import bcrypt from 'bcryptjs';

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plain text password against a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a random token for password reset or email verification
 * @param length - Token length (default: 32)
 * @returns Random token string
 */
export function generateToken(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return result
}

/**
 * Generate a secure random password
 * @param length - Password length (default: 12)
 * @returns Random password
 */
export function generatePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allCharacters = lowercase + uppercase + numbers + symbols
  let password = ''
  
  // Ensure at least one character from each set
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allCharacters[Math.floor(Math.random() * allCharacters.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Check password strength
 * @param password - Password to check
 * @returns Password strength score (0-4)
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 8) score++
  else feedback.push('Password should be at least 8 characters long')
  
  if (/[A-Z]/.test(password)) score++
  else feedback.push('Password should contain at least one uppercase letter')
  
  if (/[a-z]/.test(password)) score++
  else feedback.push('Password should contain at least one lowercase letter')
  
  if (/[0-9]/.test(password)) score++
  else feedback.push('Password should contain at least one number')
  
  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push('Password should contain at least one special character')
  
  return { score, feedback }
} 