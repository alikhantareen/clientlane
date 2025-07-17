"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import TopNavigation from "@/components/TopNavigation";

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
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch notifications");
      
      const data: NotificationResponse = await response.json();
      
      if (append) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Real-time polling for new notifications
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let latestNotificationIdRef = notifications[0]?.id;
    let currentUnreadCountRef = unreadCount;
    
    const pollForUpdates = async () => {
      try {
        const response = await fetch(`/api/notifications?page=1&limit=20`);
        if (!response.ok) return;
        
        const data: NotificationResponse = await response.json();
        
        // Check if there are new notifications
        const newLatestId = data.notifications[0]?.id;
        
        if (newLatestId && newLatestId !== latestNotificationIdRef) {
          // Update notifications and unread count
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
          
          // Update our refs
          latestNotificationIdRef = newLatestId;
          currentUnreadCountRef = data.unreadCount;
        }
      } catch (error) {
        console.error("Error polling for notifications:", error);
      }
    };
    
    const startPolling = () => {
      // Poll every 30 seconds for new notifications
      pollingInterval = setInterval(pollForUpdates, 30000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // When page becomes visible, fetch immediately and start polling
        fetchNotifications();
        startPolling();
      }
    };

    // Start polling when component mounts (after initial load)
    if (!loading) {
      startPolling();
    }
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading]); // Only depend on loading state

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

    // Navigate to the link
    if (notification.link) {
      try {
        router.push(notification.link);
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback: show a toast or stay on the same page
        alert("Unable to navigate to the content. The link may be broken.");
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
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

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const loadMore = async () => {
    if (hasMore && !loadingMore) {
      setLoadingMore(true);
      await fetchNotifications(page + 1, true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation>
          <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center py-8">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold md:text-3xl text-white">Notifications</h1>
              <p className="text-gray-300 mt-2">Loading your notifications...</p>
            </div>
          </section>
        </TopNavigation>
        <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation>
        <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center py-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold md:text-3xl text-white">Notifications</h1>
            <p className="text-gray-300 mt-2">
              Stay updated with your latest activity and updates
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchNotifications(1, false)} 
              variant="ghost" 
              size="sm"
              className="cursor-pointer text-gray-300 hover:text-white hover:bg-slate-800"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="cursor-pointer text-gray-900 border-gray-300 hover:bg-slate-800 hover:text-white">
                Mark all as read
              </Button>
            )}
          </div>
        </section>
      </TopNavigation>

      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All notifications read"}
          </span>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getNotificationTypeIcon(notification.type)}</span>
                          <CardTitle className="text-base font-medium">{notification.message}</CardTitle>
                          {!notification.is_read && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              New
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {notification.portal.name}
                        </CardDescription>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-blue-600 hover:bg-blue-100"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              
              {hasMore && (
                <div className="text-center py-4">
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    variant="outline"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
} 