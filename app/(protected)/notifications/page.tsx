"use client";

import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New comment on Portal Alpha",
      description: "Client John Doe left a comment on your portal",
      time: "2 hours ago",
      read: false,
      type: "comment"
    },
    {
      id: 2,
      title: "File uploaded to Portal Beta",
      description: "New file has been uploaded to your portal",
      time: "1 day ago",
      read: true,
      type: "file"
    },
    {
      id: 3,
      title: "Payment received",
      description: "Payment of $500 has been processed successfully",
      time: "3 days ago",
      read: false,
      type: "payment"
    }
  ]);

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your latest activity and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

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
          notifications.map((notification) => (
            <Card key={notification.id} className={`${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      {!notification.read && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          New
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">
                      {notification.description}
                    </CardDescription>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        className="text-blue-600 hover:bg-blue-100"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 