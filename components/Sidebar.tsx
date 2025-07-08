"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LogOut,
  Menu,
  CreditCard,
  LaptopMinimal,
  User,
  Users,
  Bell,
  MoreHorizontal,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const freelancerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/portal", label: "Portals", icon: LaptopMinimal },
  { href: "/clients", label: "Clients", icon: Users },
];
const clientLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/portal", label: "Portals", icon: LaptopMinimal },
];
const bottomLinks: any[] = [];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}
export default function Sidebar({ open, setOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Handle window resize to properly control sidebar behavior
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth >= 1024;
      setIsLargeScreen(isLarge);
      // Auto-close sidebar on mobile when resizing from desktop
      if (!isLarge && !open) {
        setOpen(false);
      }
    };

    // Initial check
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [open, setOpen]);

  // Only allow toggling on md and below
  const handleMenuClick = () => {
    if (!isLargeScreen) {
      setOpen(!open);
    }
  };

  // Always open on large screens
  const sidebarVisible = isLargeScreen ? true : open;

  return (
    <aside
      className={`h-screen w-64 bg-black text-white flex flex-col fixed top-0 left-0 z-50 transition-transform duration-300 ${sidebarVisible ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:h-auto lg:min-h-full lg:self-stretch`}
    >
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
            {user?.role === "freelancer"
              ? freelancerLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-800/80 ${pathname?.startsWith(href) ? "bg-gray-800" : ""}`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))
              : clientLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-800/80 ${pathname?.startsWith(href) ? "bg-gray-800" : ""}`}
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
                className={`flex items-center gap-3 px-4 py-2 rounded-md text-base font-medium transition-colors hover:bg-gray-800/80 ${pathname?.startsWith(href) ? "bg-gray-800" : ""}`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
        {/* User/Profile section with dropdown */}
        <div className="p-4 border-t border-gray-800 mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full text-left rounded-md p-2 hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-semibold">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "Profile"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="right"
              className="w-56 mb-2 ml-2"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Account
                </Link>
              </DropdownMenuItem>
              {user?.role === "freelancer" && (
                <DropdownMenuItem asChild>
                  <Link
                    href="/subscriptions"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link
                  href="/notifications"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Logout Dialog */}
          <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log out</DialogTitle>
                <DialogDescription>
                  Are you sure you want to log out?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogPrimitive.Close asChild>
                  <button
                    className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer"
                    onClick={() => setShowLogoutDialog(false)}
                  >
                    Cancel
                  </button>
                </DialogPrimitive.Close>
                <button
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                  onClick={() => {
                    setShowLogoutDialog(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                >
                  Log out
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </aside>
  );
}
