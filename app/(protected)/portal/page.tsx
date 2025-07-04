"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PortalCard, PortalCardSkeleton } from "@/components/ui";
import { useEffect, useState } from "react";
import DefaultPortalImage from "@/public/defaultPortalImage.png";

export default function AllPortalsPage() {
  const [portals, setPortals] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  useEffect(() => {
    // Initial fetch
    fetchPortals(1, true);
    // eslint-disable-next-line
  }, []);

  async function fetchPortals(pageNum: number, replace = false) {
    setLoading(true);
    const res = await fetch(`/api/portals?page=${pageNum}&limit=${limit}`);
    const data = await res.json();
    if (replace) {
      setPortals(data.portals);
    } else {
      setPortals((prev) => [...prev, ...data.portals]);
    }
    setTotal(data.total);
    setHasMore((pageNum * limit) < data.total);
    setLoading(false);
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPortals(nextPage);
  }

  return (
    <main className="w-full mx-auto py-2">
      <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center">
        <h1 className="text-2xl font-bold mb-4 md:text-3xl">My Portals</h1>
        <Link
          href="/portal/create"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black text-white hover:bg-gray-800 hover:text-white cursor-pointer w-full md:w-fit px-4 py-2 gap-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Portal
        </Link>
      </section>
      <hr className="my-4" />

      {/* Portals Grid Section */}
      <section className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading && portals.length === 0
            ? Array.from({ length: 8 }).map((_, i) => <PortalCardSkeleton key={i} />)
            : portals.map((portal) => (
                <PortalCard
                  key={portal.id}
                  cardImage={portal.thumbnail_url || DefaultPortalImage}
                  initials={portal.clientName?.charAt(0) || "CL"}
                  title={portal.name}
                  status={portal.status.charAt(0).toUpperCase() + portal.status.slice(1)}
                  statusColor={portal.status === "active" ? "#268E00" : portal.status === "pending" ? "#FFA500" : "#9E9E9E"}
                  clientName={`Client: ${portal.clientName}`}
                  lastUpdated={`Last Updated: ${new Date(portal.updated_at).toLocaleDateString()}`}
                  newComments={`${portal.commentsCount} New Comments`}
                  onShareLink={() => {}}
                  onView={() => {}}
                />
              ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 rounded-md bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
