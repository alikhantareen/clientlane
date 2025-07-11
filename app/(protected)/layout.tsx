"use client";
import { ReactNode, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Navbar from '@/components/Navbar'
import { UserProvider } from '@/lib/contexts/UserContext'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="flex items-center justify-center h-64">
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

  return (
    <UserProvider>
      <div className="h-screen min-h-screen flex bg-gray-50">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar setSidebarOpen={setSidebarOpen} />
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  )
} 