import React from "react";

export function PortalCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100">
      {/* Image skeleton */}
      <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-200 to-gray-300" />
      
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
        
        {/* Details skeleton */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        </div>
        
        {/* Button skeleton */}
        <div className="pt-2">
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default PortalCardSkeleton;
