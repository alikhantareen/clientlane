import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ArrowUpRight, Calendar, User, Bell } from "lucide-react";
import { PortalCardSkeleton } from "@/components/skeletons/PortalCardSkeleton";

export interface PortalCardProps {
  cardImage: string;
  initials: string;
  title: string;
  status: string;
  statusColor?: string; // hex or tailwind color
  clientName: string;
  freelancerName?: string;
  lastUpdated: string;
  newUpdates: string;
  onShareLink?: () => void;
  onView?: () => void;
  shareLabel?: string;
  viewLabel?: string;
  dueDate?: string;
  userImage?: string; // Add user profile image prop
}

export function PortalCard({
  cardImage,
  initials,
  title,
  status,
  statusColor = "#10B981",
  clientName,
  freelancerName,
  lastUpdated,
  newUpdates,
  onShareLink,
  onView,
  shareLabel = "Share Link",
  viewLabel = "View Portal",
  dueDate,
  userImage
}: PortalCardProps) {
  const { data: session } = useSession();
  const user = session?.user as any;

  // Get status color based on status text
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('completed')) return '#10B981';
    if (statusLower.includes('pending') || statusLower.includes('draft')) return '#F59E0B';
    if (statusLower.includes('overdue') || statusLower.includes('cancelled')) return '#EF4444';
    return statusColor;
  };

  const statusBgColor = getStatusColor(status);

  return (
    <div className="group relative w-full bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 hover:scale-[1.02] transform">
      {/* Card Image with Overlay */}
      <div className="relative w-full aspect-[16/9]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 z-10" />
        <Image
          src={cardImage}
          alt={`${title} portal`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-20">
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg backdrop-blur-sm bg-black/10 border border-white/20"
            style={{
              backgroundColor: statusBgColor,
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white/80 mr-2" />
            {status}
          </span>
        </div>

        {/* Quick Stats Overlay */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
            <Bell className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-800">{newUpdates}</span>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-4">
        {/* Title Section */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {title}
          </h3>
          
          {/* Owner/Avatar Section */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {userImage ? (
                <div className="w-10 h-10 rounded-full overflow-hidden shadow-md flex-shrink-0">
                  <Image
                    src={userImage}
                    alt={`${user?.role === "freelancer" ? clientName : freelancerName} profile`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white text-sm font-semibold">
                    {initials}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.role === "freelancer" ? clientName : freelancerName}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === "freelancer" ? "Client" : "Freelancer"}
              </p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">
                {user?.role === "freelancer" ? "Client" : "Freelancer"}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
              {user?.role === "freelancer" ? clientName : freelancerName}
            </span>
          </div>
          
          {dueDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Due Date</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {dueDate}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 group/button cursor-pointer"
            onClick={onView}
          >
            <span className="flex items-center gap-2">
              {viewLabel}
              <ArrowUpRight className="w-5 h-5 group-hover/button:translate-x-1 group-hover/button:-translate-y-1 transition-transform duration-200" />
            </span>
          </Button>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 transition-colors duration-300 pointer-events-none" />
    </div>
  );
}

// PortalCardSkeleton has been moved to @/components/skeletons/PortalCardSkeleton
