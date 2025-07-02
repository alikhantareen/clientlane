import { ReactNode } from 'react'

interface ProtectedLayoutProps {
  children: ReactNode
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  // TODO: Add authentication logic here
  // This layout will wrap all protected routes
  // Example: Check if user is authenticated, redirect if not
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* TODO: Add navigation/header for authenticated users */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-semibold text-gray-900">Protected Area</h1>
            {/* TODO: Add user menu, logout, etc. */}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
} 