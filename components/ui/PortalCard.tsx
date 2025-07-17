import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ArrowUpRight } from "lucide-react";

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
  dueDate?: string
}

export function PortalCard({
  cardImage,
  initials,
  title,
  status,
  statusColor = "#F59E0B",
  clientName,
  freelancerName,
  lastUpdated,
  newUpdates,
  onShareLink,
  onView,
  shareLabel = "Share Link",
  viewLabel = "View",
  dueDate
}: PortalCardProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  return (
    <div className="w-full bg-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:scale-[1.02] transform border-2 border-gray-300">
      {/* Card Image */}
      <div className="relative w-full aspect-[16/9] p-3">
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          <Image
            src={cardImage}
            alt="Portal Card"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
        {/* Status Badge */}
        <div className="absolute top-6 right-6">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-white text-xs font-medium"
            style={{
              backgroundColor: statusColor,
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Title Section */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {initials}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {user?.role === "freelancer" ? `${clientName}` : `${freelancerName}`}
            </span>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {user?.role === "freelancer" ? "Client" : "Freelancer"}:
            </span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
              {user?.role === "freelancer" ? clientName : freelancerName}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Due Date:</span>
            <span className="text-sm font-medium text-gray-900">
              {dueDate}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">New updates:</span>
            <span className="text-sm font-medium text-gray-900">
              {newUpdates}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
            onClick={onView}
          >
            {viewLabel}
            <ArrowUpRight className="ml-2 w-5 h-5 group-hover/button:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PortalCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-xl shadow-xl overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full aspect-[16/9] bg-gray-300" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-300 rounded w-3/4" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0" />
            <div className="h-4 bg-gray-300 rounded w-24" />
          </div>
        </div>
        
        {/* Details skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-300 rounded w-16" />
            <div className="h-4 bg-gray-300 rounded w-20" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-300 rounded w-20" />
            <div className="h-4 bg-gray-300 rounded w-16" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-300 rounded w-18" />
            <div className="h-4 bg-gray-300 rounded w-12" />
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="pt-2">
          <div className="w-full h-10 bg-gray-300 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
