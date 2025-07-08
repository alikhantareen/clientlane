"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Upload,
  MessageCircle,
  Settings,
  FileText,
  Reply,
  FolderPlus,
  Share2,
  Trash2,
  CalendarIcon,
  Loader2,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ActivityTabProps {
  portalId: string;
}

interface ActivityUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ActivityData {
  id: string;
  portal_id: string;
  user_id: string;
  type: string;
  meta: any;
  created_at: string;
  user: ActivityUser;
}

interface ActivitiesResponse {
  activities: ActivityData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Helper functions
function getActivityIcon(type: string) {
  switch (type) {
    case "upload":
    case "file_uploaded":
      return Upload;
    case "comment":
      return MessageCircle;
    case "status_change":
      return Settings;
    case "update_created":
      return FileText;
    case "reply_created":
      return Reply;
    case "file_deleted":
    case "update_deleted":
    case "reply_deleted":
      return Trash2;
    case "portal_created":
      return FolderPlus;
    case "shared_link_created":
      return Share2;
    default:
      return FileText;
  }
}

function getActivityColor(type: string): string {
  switch (type) {
    case "upload":
    case "file_uploaded":
      return "text-blue-600";
    case "comment":
      return "text-green-600";
    case "status_change":
      return "text-orange-600";
    case "update_created":
      return "text-purple-600";
    case "reply_created":
      return "text-indigo-600";
    case "file_deleted":
    case "update_deleted":
    case "reply_deleted":
      return "text-red-600";
    case "portal_created":
      return "text-emerald-600";
    case "shared_link_created":
      return "text-cyan-600";
    default:
      return "text-gray-600";
  }
}

function getActivityBgColor(type: string): string {
  switch (type) {
    case "upload":
    case "file_uploaded":
      return "bg-blue-100";
    case "comment":
      return "bg-green-100";
    case "status_change":
      return "bg-orange-100";
    case "update_created":
      return "bg-purple-100";
    case "reply_created":
      return "bg-indigo-100";
    case "file_deleted":
    case "update_deleted":
    case "reply_deleted":
      return "bg-red-100";
    case "portal_created":
      return "bg-emerald-100";
    case "shared_link_created":
      return "bg-cyan-100";
    default:
      return "bg-gray-100";
  }
}

function formatActivityMessage(activity: ActivityData): string {
  const { type, meta } = activity;

  switch (type) {
    case "upload":
    case "file_uploaded":
      if (meta.file_name) {
        return `uploaded ${meta.file_name}`;
      }
      return "uploaded a file";

    case "comment":
      return "added a comment";

    case "status_change":
      if (meta.old_status && meta.new_status) {
        return `changed portal status from ${meta.old_status} to ${meta.new_status}`;
      }
      return "changed portal status";

    case "update_created":
      if (meta.update_title) {
        return `created update "${meta.update_title}"`;
      }
      return "created a new update";

    case "reply_created":
      return "replied to an update";

    case "portal_created":
      if (meta.portal_name) {
        return `created portal "${meta.portal_name}"`;
      }
      return "created the portal";

    case "shared_link_created":
      return "created a shared link";

    case "file_deleted":
      if (meta.file_name) {
        return `deleted ${meta.file_name}`;
      }
      return "deleted a file";

    case "update_deleted":
      if (meta.update_title) {
        return `deleted update "${meta.update_title}"`;
      }
      return "deleted an update";

    case "reply_deleted":
      return "deleted a reply";

    default:
      return "performed an action";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function ActivityTab({ portalId }: ActivityTabProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [total, setTotal] = useState(0);

  const fetchActivities = async (pageNum: number = 1, replace: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);

      const params = new URLSearchParams({
        portalId,
        page: String(pageNum),
        limit: "20",
      });

      if (dateRange?.from) {
        params.append("dateFrom", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("dateTo", dateRange.to.toISOString());
      }

      const response = await fetch(`/api/activities?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data: ActivitiesResponse = await response.json();

      if (replace) {
        setActivities(data.activities);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
      }
      
      setHasMore(data.hasMore);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activities");
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, true);
    setPage(1);
  }, [portalId, dateRange]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, false);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
  };

  const hasDateFilter = dateRange && (dateRange.from || dateRange.to);

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <FileText className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Activities</h3>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={() => fetchActivities(1, true)} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Portal Activity
          </h3>
          <p className="text-sm text-gray-600">
            {total > 0 ? `${total} activities` : "No activities yet"}
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-sm min-w-0 sm:min-w-[200px] justify-start"
                type="button"
              >
                <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                    : dateRange?.from
                    ? `From ${format(dateRange.from, "MMM d, yyyy")}`
                    : "Filter by date"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {hasDateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateFilter}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-4">
        {loading && activities.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading activities...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Activities Found
              </h3>
              <p className="text-sm">
                {hasDateFilter 
                  ? "No activities found for the selected date range."
                  : "Activity will appear here as users interact with the portal."
                }
              </p>
            </div>
            {hasDateFilter && (
              <Button onClick={clearDateFilter} variant="outline" size="sm">
                Clear Date Filter
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const isLast = index === activities.length - 1;

              return (
                <div key={activity.id} className="relative flex items-center gap-3 pb-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200" />
                  )}

                  {/* Activity Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getActivityBgColor(
                      activity.type
                    )}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${getActivityColor(activity.type)}`}
                    />
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user.name}</span>{" "}
                          <span>{formatActivityMessage(activity)}</span>
                        </p>

                        {/* Additional metadata */}
                        {activity.meta.file_size && (
                          <p className="text-xs text-gray-500 mt-1">
                            Size: {formatFileSize(activity.meta.file_size)}
                          </p>
                        )}
                        {activity.meta.file_type && (
                          <p className="text-xs text-gray-500">
                            Type: {activity.meta.file_type}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        <time className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Activities"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}