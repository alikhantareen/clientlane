import { ReactNode } from 'react'

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Public navigation */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Your App</h1>
            </div>
            
            <nav className="flex space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Home
              </a>
              <a href="/about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                About
              </a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Contact
              </a>
              {/* TODO: Add login/signup buttons */}
              <a href="/login" className="bg-blue-600 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-blue-700">
                Login
              </a>
            </nav>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            © 2024 Your App. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
} 