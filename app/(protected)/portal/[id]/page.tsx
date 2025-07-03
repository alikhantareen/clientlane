"use client";

import { useParams } from "next/navigation";

export default function PortalDetailPage() {
  const params = useParams();
  const { id } = params;

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Portal: {id}</h1>
      <p className="text-gray-600 mb-8">This page will show details for portal <span className="font-mono bg-gray-100 px-2 py-1 rounded">{id}</span>.</p>
      {/* TODO: Render portal details here */}
    </div>
  );
} 