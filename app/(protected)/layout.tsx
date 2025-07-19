"use client";
import { ReactNode } from 'react'
import { UserProvider } from '@/lib/contexts/UserContext'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import TopNavigation from '@/components/TopNavigation'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname() || '';
  const { data: session, status } = useSession();
  const user = session?.user as any;

  // Array of freelancer-only routes (add more as needed)
  const freelancerOnlyRoutes = [
    '/portal/create',
    '/subscriptions',
    '/clients',
  ];
  // Also protect dynamic edit route
  const isFreelancerOnly =
    freelancerOnlyRoutes.includes(pathname) ||
    /^\/portal\/[^/]+\/edit$/.test(pathname);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  if (isFreelancerOnly && (!user || user.role !== 'freelancer')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only freelancers can access this page.</p>
        </div>
      </div>
    );
  }

  // Check if this is a dashboard, portal, clients, or notifications page - if so, let the page handle its own layout
  const isCustomLayoutPage = pathname === '/dashboard' || pathname === '/portal' || pathname === '/clients' || pathname === '/notifications' || /^\/portal\/[^/]+$/.test(pathname);

  return (
    <UserProvider>
      {isCustomLayoutPage ? (
        // Dashboard, portal, and clients pages handle their own layout with TopNavigation
        children
      ) : (
        // Non-dashboard pages get the standard layout with TopNavigation
        <div className="min-h-screen bg-gray-50">
          <TopNavigation />
          <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      )}
    </UserProvider>
  )
} 