"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Folder, Users, Settings, LogOut, Menu, Plus, Share2, CreditCard, LaptopMinimal } from "lucide-react";
import { signOut } from "next-auth/react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/portals", label: "Portals", icon: LaptopMinimal },
  { href: "/create-portal", label: "Create Portal", icon: Plus },
  { href: "/shared-links", label: "Shared Links", icon: Share2 },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
];
const bottomLinks = [
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Only allow toggling on md and below
  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      setOpen(!open);
    }
  };

  // Always open on large screens
  const isLargeScreen = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const sidebarVisible = isLargeScreen ? true : open;

  return (
    <aside className={`h-screen w-64 bg-black text-white flex flex-col fixed top-0 left-0 z-50 transition-transform duration-300 ${sidebarVisible ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0`}>
      {/* Logo and Hamburger */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800 gap-2">
        <button
          className="p-2 rounded-md bg-black/80 text-white hover:bg-gray-800 focus:outline-none transition-colors lg:hidden md:block"
          onClick={handleMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-2xl font-bold tracking-tight">Clientlane</span>
      </div>
      {/* Navigation and user section, toggle visibility on mobile */}
      <div className="flex-1 flex flex-col"> 
        <nav className="flex-1 py-6 px-2 flex flex-col justify-between">
          <div className="space-y-2">
            {mainLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-800/80 ${pathname.startsWith(href) ? "bg-gray-800" : ""}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
          <div className="space-y-2 mb-4">
            {bottomLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-800/80 ${pathname.startsWith(href) ? "bg-gray-800" : ""}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-800/80 w-full text-left cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Logout</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to logout?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogPrimitive.Close asChild>
                    <button
                      className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </DialogPrimitive.Close>
                  <button
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    Logout
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </nav>
        {/* User/Profile section */}
        <div className="p-4 border-t border-gray-800 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-semibold">
              {session?.user?.name?.charAt(0)}
            </div>
            <div>
              <div className="font-medium">{session?.user?.name}</div>
              <div className="text-xs text-gray-400">{session?.user?.email}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
} 