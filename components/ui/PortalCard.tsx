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
      className="w-full md:w-[305px] h-[396px] rounded-[5px] bg-[#D9D9D9] shadow-[0_8px_8px_0_rgba(0,0,0,0.25)] flex flex-col relative overflow-hidden p-4 gap-4"
      style={{ boxShadow: "0px 8px 8px 0px rgba(0, 0, 0, 0.25)" }}
    >
      {/* Card Image */}
      <div className="relative w-full md:w-[278px] h-[164px] mx-auto rounded-[5px] overflow-hidden">
        <Image
          src={cardImage}
          alt="Portal Card"
          fill
          className="object-cover rounded-[5px]"
          loading="lazy"
        />
      </div>

      {/* Title and Avatar Row */}
      <div className="flex items-center gap-2 pt-2">
        {/* Ellipse with initials */}
        <div className="w-[27px] h-[27px] flex items-center justify-center">
          <span className="font-semibold text-[14px] leading-[1.21] text-white select-none bg-black rounded-full w-full h-full flex items-center justify-center">
            {initials}
          </span>
        </div>
        {/* Title */}
        <span className="font-semibold text-[18px] leading-[1.21] text-black truncate">
          {title}
        </span>
        {/* Status Pill */}
        <span
          className="ml-auto flex items-center px-4 py-1 rounded-full text-white text-[12px] font-normal"
          style={{
            minWidth: 65,
            height: 20,
            justifyContent: "center",
            background: statusColor,
          }}
        >
          {status}
        </span>
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="font-normal text-[14px] leading-[1.21] text-black truncate">
          {clientName}
        </div>
        <div className="font-normal text-[14px] leading-[1.21] text-black truncate">
          {lastUpdated}
        </div>
        <div className="font-normal text-[14px] leading-[1.21] text-black truncate">
          {newComments}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-auto">
        <Button
          variant="outline"
          className="w-[128px] h-[28px] rounded-[5px] border border-[#9E9E9E] text-black text-[14px] font-normal px-0"
          style={{ background: "#D9D9D9" }}
          onClick={onShareLink}
        >
          {shareLabel}
        </Button>
        <Button
          className="w-[128px] h-[28px] rounded-[5px] border border-[#9E9E9E] bg-black text-white text-[14px] font-bold px-0"
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
      className="w-full md:w-[305px] h-[396px] rounded-[5px] bg-[#e5e7eb] shadow-[0_8px_8px_0_rgba(0,0,0,0.10)] flex flex-col relative overflow-hidden animate-pulse p-4 gap-4"
      style={{ boxShadow: "0px 8px 8px 0px rgba(0, 0, 0, 0.10)" }}
    >
      {/* Image skeleton */}
      <div className="w-full md:w-[278px] h-[164px] mx-auto rounded-[5px] bg-gray-300" />
      {/* Row skeleton */}
      <div className="flex items-center gap-2 pt-2">
        <div className="w-[27px] h-[27px] rounded-full bg-gray-300" />
        <div className="h-6 w-[120px] rounded bg-gray-300" />
        <div className="ml-auto h-5 w-[65px] rounded-full bg-gray-300" />
      </div>
      {/* Text skeletons */}
      <div className="flex flex-col gap-1 pt-2">
        <div className="h-4 w-[180px] rounded bg-gray-300" />
        <div className="h-4 w-[140px] rounded bg-gray-300" />
        <div className="h-4 w-[120px] rounded bg-gray-300" />
      </div>
      {/* Button skeletons */}
      <div className="flex gap-3 mt-auto">
        <div className="w-[128px] h-[28px] rounded-[5px] bg-gray-300" />
        <div className="w-[128px] h-[28px] rounded-[5px] bg-gray-300" />
      </div>
    </div>
  );
}
