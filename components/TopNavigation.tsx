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
  X,
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
import { useUser } from "@/lib/contexts/UserContext";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

const freelancerLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/portal", label: "Portals", icon: LaptopMinimal },
  { href: "/clients", label: "Clients", icon: Users },
];

const clientLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/portal", label: "Portals", icon: LaptopMinimal },
];

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  portal: {
    id: string;
    name: string;
    thumbnail_url: string | null;
  };
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

interface TopNavigationProps {
  children?: React.ReactNode;
}

export default function TopNavigation({ children }: TopNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const { user: userData } = useUser();
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const response = await fetch("/api/notifications?page=1&limit=10");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      
      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notification.id }),
        });
        
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Close popover and navigate
    setPopoverOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const markAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case "new_comment":
        return "💬";
      case "file_uploaded":
        return "📁";
      case "portal_updated":
        return "⚙️";
      case "new_update":
        return "📝";
      default:
        return "🔔";
    }
  };

  const handleSeeAllNotifications = () => {
    setPopoverOpen(false);
    router.push("/notifications");
  };

  const navigationLinks = user?.role === "freelancer" ? freelancerLinks : clientLinks;

  return (
    <>
      {/* Dark Background Wrapper */}
      <div className="bg-slate-900 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4">
        {/* Top Navigation */}
        <nav className="sticky top-0 z-50">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/dashboard" className="flex items-center">
                  <span className="text-2xl font-bold text-white">Clientlane</span>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                {navigationLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname?.startsWith(href)
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </div>

              {/* Right side items */}
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button className="p-2 rounded-full hover:bg-slate-800 relative cursor-pointer">
                      <Bell className="w-5 h-5 text-gray-300" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center min-w-[20px]"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notificationLoading ? (
                        <div className="p-4 space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.is_read ? 'bg-blue-50/50' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-sm mt-0.5 flex-shrink-0">
                                  {getNotificationTypeIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {notification.portal.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="p-3 border-t">
                        <Button 
                          variant="ghost" 
                          className="w-full text-sm"
                          onClick={handleSeeAllNotifications}
                        >
                          See all notifications
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        {userData?.image ? (
                          <Image
                            src={userData.image}
                            alt={userData.name || "Profile"}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-white">{userData?.name}</div>
                        <div className="text-xs text-gray-400">{userData?.email}</div>
                      </div>
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "freelancer" && (
                      <DropdownMenuItem asChild>
                        <Link href="/subscriptions" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="w-4 h-4" />
                          Billing
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/notifications" className="flex items-center gap-2 cursor-pointer">
                        <Bell className="w-4 h-4" />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowLogoutDialog(true)}
                      className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 rounded-lg hover:bg-slate-800"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Stats Section - Part of the dark wrapper */}
        {children && (
          <div className="w-full px-4 sm:px-6 lg:px-8 pb-8">
            {children}
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 w-64 h-full bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <span className="text-lg font-semibold text-white">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {navigationLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname?.startsWith(href)
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

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
              <Button variant="outline" onClick={() => setShowLogoutDialog(false)} className="cursor-pointer">
                Cancel
              </Button>
            </DialogPrimitive.Close>
            <Button
              variant="destructive"
              onClick={() => {
                setShowLogoutDialog(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="cursor-pointer"
            >
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 