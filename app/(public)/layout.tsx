import { ReactNode } from 'react'
import Image from 'next/image'
import logo from '@/public/icons/lightTransparentLogo.png'

interface PublicLayoutProps {
  children: ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex h-screen bg-white">
      {/* Left: Branding */}
      <div className="hidden md:flex h-full w-1/2 flex-col justify-center items-center bg-slate-900 text-white">
        <div className="w-full px-12 py-16 flex flex-col items-start">
          <Image src={logo} alt="Clientlane" width={300} height={300}/>
          <p className="text-2xl font-light">Everything your client needs<br />in one portal.</p>
        </div>
      </div>
      {/* Right: Page Content */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-16 w-1/2">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </div>
  )
} 