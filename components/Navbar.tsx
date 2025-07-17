"use client";
import { Bell, Menu, Check, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface NavbarProps {
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
}

export default function Navbar({ setSidebarOpen, title = "Dashboard" }: NavbarProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?page=1&limit=10");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      
      const data: NotificationResponse = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
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
      case "deadline_reminder":
        return "⏰";
      default:
        return "🔔";
    }
  };

  const handleSeeAllNotifications = () => {
    setPopoverOpen(false);
    router.push("/notifications");
  };

  return (
    <header className="h-16 bg-black border-b border-gray-200 flex items-center px-6 justify-between lg:justify-end">
      <div className="flex items-center gap-2 md:gap-4 lg:hidden">
        <button
          className="p-2 rounded-md bg-black/80 text-white hover:bg-gray-800 focus:outline-none transition-colors md:block"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="md:inline text-2xl font-bold tracking-tight">Clientlane</span>
      </div>
      <div className="flex items-center gap-4">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-gray-100 relative cursor-pointer">
              <Bell className="w-5 h-5 text-gray-500 cursor-pointer" />
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
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center cursor-pointer">
                  <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 cursor-pointer" />
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
                            <>
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => markAsRead(notification.id, e)}
                                className="text-blue-600 hover:bg-blue-100 h-6 w-6 p-0"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <ExternalLink className="w-3 h-3 text-gray-400" />
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
                  className="w-full text-sm cursor-pointer"
                  onClick={handleSeeAllNotifications}
                >
                  See all notifications
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
} 