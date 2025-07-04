import React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export interface PortalCardProps {
  cardImage: string;
  initials: string;
  title: string;
  status: string;
  statusColor?: string; // hex or tailwind color
  clientName: string;
  lastUpdated: string;
  newComments: string;
  onShareLink?: () => void;
  onView?: () => void;
  shareLabel?: string;
  viewLabel?: string;
}

export function PortalCard({
  cardImage,
  initials,
  title,
  status,
  statusColor = "#268E00",
  clientName,
  lastUpdated,
  newComments,
  onShareLink,
  onView,
  shareLabel = "Share Link",
  viewLabel = "View",
}: PortalCardProps) {
  return (
    <div
      className="w-full min-h-[350px] sm:min-h-[380px] md:min-h-[396px] rounded-[5px] bg-[#D9D9D9] shadow-[0_8px_8px_0_rgba(0,0,0,0.25)] flex flex-col relative overflow-hidden p-3 sm:p-4 gap-3 sm:gap-4 group hover:shadow-[0_12px_16px_0_rgba(0,0,0,0.35)] transition-shadow duration-300"
      style={{ boxShadow: "0px 8px 8px 0px rgba(0, 0, 0, 0.25)" }}
    >
      {/* Card Image */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[278/164] rounded-[5px] overflow-hidden">
        <Image
          src={cardImage}
          alt="Portal Card"
          fill
          className="object-cover rounded-[5px] group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {/* Title and Avatar Row */}
      <div className="flex items-center gap-2 pt-1 sm:pt-2">
        {/* Ellipse with initials */}
        <div className="w-6 h-6 sm:w-[27px] sm:h-[27px] flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-xs sm:text-[14px] leading-[1.21] text-white select-none bg-black rounded-full w-full h-full flex items-center justify-center">
            {initials}
          </span>
        </div>
        {/* Title */}
        <span className="font-semibold text-base sm:text-[18px] leading-[1.21] text-black truncate flex-1 min-w-0">
          {title}
        </span>
        {/* Status Pill */}
        <span
          className="flex items-center px-2 sm:px-3 py-1 rounded-full text-white text-xs font-normal whitespace-nowrap flex-shrink-0"
          style={{
            minWidth: 50,
            height: 18,
            justifyContent: "center",
            background: statusColor,
          }}
        >
          {status}
        </span>
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2 flex-1">
        <div className="font-normal text-xs sm:text-[14px] leading-[1.21] text-black truncate">
          {clientName}
        </div>
        <div className="font-normal text-xs sm:text-[14px] leading-[1.21] text-black truncate">
          {lastUpdated}
        </div>
        <div className="font-normal text-xs sm:text-[14px] leading-[1.21] text-black truncate">
          {newComments}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto w-full">
        <Button
          variant="outline"
          className="flex-1 sm:min-w-[100px] h-7 sm:h-[28px] rounded-[5px] border border-[#9E9E9E] text-black text-xs sm:text-[14px] font-normal px-2 sm:px-3 hover:bg-[#c5c5c5] transition-colors cursor-pointer"
          style={{ background: "#D9D9D9" }}
          onClick={onShareLink}
        >
          {shareLabel}
        </Button>
        <Button
          className="flex-1 sm:min-w-[100px] h-7 sm:h-[28px] rounded-[5px] border border-[#9E9E9E] bg-black text-white text-xs sm:text-[14px] font-bold px-2 sm:px-3 hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={onView}
        >
          {viewLabel}
        </Button>
      </div>
    </div>
  );
}

export function PortalCardSkeleton() {
  return (
    <div
      className="w-full min-h-[350px] sm:min-h-[380px] md:min-h-[396px] rounded-[5px] bg-[#e5e7eb] shadow-[0_8px_8px_0_rgba(0,0,0,0.10)] flex flex-col relative overflow-hidden animate-pulse p-3 sm:p-4 gap-3 sm:gap-4"
      style={{ boxShadow: "0px 8px 8px 0px rgba(0, 0, 0, 0.10)" }}
    >
      {/* Image skeleton */}
      <div className="w-full aspect-[16/9] sm:aspect-[278/164] rounded-[5px] bg-gray-300" />
      {/* Row skeleton */}
      <div className="flex items-center gap-2 pt-1 sm:pt-2">
        <div className="w-6 h-6 sm:w-[27px] sm:h-[27px] rounded-full bg-gray-300 flex-shrink-0" />
        <div className="h-5 sm:h-6 w-full max-w-[120px] rounded bg-gray-300 flex-1" />
        <div className="h-4 sm:h-5 w-[50px] sm:w-[65px] rounded-full bg-gray-300 flex-shrink-0" />
      </div>
      {/* Text skeletons */}
      <div className="flex flex-col gap-2 sm:gap-3 pt-1 sm:pt-2 flex-1">
        <div className="h-3 sm:h-4 w-full max-w-[180px] rounded bg-gray-300" />
        <div className="h-3 sm:h-4 w-full max-w-[140px] rounded bg-gray-300" />
        <div className="h-3 sm:h-4 w-full max-w-[120px] rounded bg-gray-300" />
      </div>
      {/* Button skeletons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-auto">
        <div className="flex-1 sm:min-w-[100px] h-7 sm:h-[28px] rounded-[5px] bg-gray-300" />
        <div className="flex-1 sm:min-w-[100px] h-7 sm:h-[28px] rounded-[5px] bg-gray-300" />
      </div>
    </div>
  );
}
