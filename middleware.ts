import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected/dashboard, etc.)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
                      path.startsWith('/(public)') ||
                      path.startsWith('/about') ||
                      path.startsWith('/contact') ||
                      path.startsWith('/login') ||
                      path.startsWith('/signup') ||
                      path.startsWith('/forgot-password') ||
                      path.startsWith('/reset-password') ||
                      path.startsWith('/otp') ||
                      path.startsWith('/api/auth') ||
                      path.startsWith('/_next') ||
                      path.startsWith('/favicon.ico')

  // Define protected paths that require authentication
  const isProtectedPath = path.startsWith('/(protected)') || 
                         path.startsWith('/dashboard') ||
                         path.startsWith('/portal') ||
                         path.startsWith('/clients') ||
                         path.startsWith('/notifications') ||
                         path.startsWith('/subscriptions') ||
                         path.startsWith('/settings') ||
                         path.startsWith('/shared-links')

  // Check if user is authenticated using NextAuth JWT
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  const isAuthenticated = !!token

  // Redirect unauthenticated users away from protected routes
  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from login/signup pages
  if (isAuthenticated && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow the request to continue
  return NextResponse.next()
}

// Configure which paths this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 