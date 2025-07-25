"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PortalCard } from "@/components/ui";
import { PortalCardSkeleton } from "@/components/skeletons/PortalCardSkeleton";
import { useEffect, useState } from "react";
import DefaultPortalImage from "@/public/defaultPortalImage.png";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { CalendarIcon, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { StatusMultiSelect } from "@/components/ui/StatusMultiSelect";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlanLimitWarningBanner } from "@/components/ui";
import TopNavigation from "@/components/TopNavigation";
import { PortalCreateDialog } from "@/components/ui";

export default function AllPortalsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const [portals, setPortals] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [canCreatePortal, setCanCreatePortal] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [hasEverLoadedPortals, setHasEverLoadedPortals] = useState<
    boolean | null
  >(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch total portals on mount to determine if any exist
  useEffect(() => {
    async function checkAnyPortals() {
      const res = await fetch("/api/portals?page=1&limit=1");
      const data = await res.json();
      setHasEverLoadedPortals(data.total > 0);
    }
    checkAnyPortals();
  }, []);

  // Check if user can create portal
  useEffect(() => {
    const checkLimits = async () => {
      if (!session?.user || user?.role !== "freelancer") return;
      
      try {
        const response = await fetch('/api/plan-limits/check-portal-creation');
        const data = await response.json();
        
        setCanCreatePortal(data.allowed);
        if (!data.allowed) {
          setLimitMessage(data.reason || "Unable to create portal");
        }
      } catch (error) {
        console.error('Error checking portal limits:', error);
      }
    };

    checkLimits();
  }, [session, user]);

  useEffect(() => {
    // Initial fetch
    fetchPortals(1, true);
    // eslint-disable-next-line
  }, []);

  // Debounced search
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchPortals(1, true, e.target.value, status, dateRange);
    }, 400);
  }

  function handleStatusChange(newStatuses: string[]) {
    setStatus(newStatuses);
    fetchPortals(1, true, search, newStatuses, dateRange);
  }

  function handleDateRangeChange(range: DateRange | undefined) {
    setDateRange(range);
    fetchPortals(1, true, search, status, range);
  }

  // Update fetchPortals to accept filters (for now, just pass them, don't use in API call)
  async function fetchPortals(
    pageNum: number,
    replace = false,
    searchVal?: string,
    statusVal?: string[],
    dateRangeVal?: DateRange | undefined
  ) {
    setLoading(true);

    // If any filter parameter is passed, use all passed values; otherwise use current state
    const usePassedValues = searchVal !== undefined;
    const finalSearchVal = usePassedValues ? searchVal : search;
    const finalStatusVal = usePassedValues ? statusVal : status;
    const finalDateRangeVal = usePassedValues ? dateRangeVal : dateRange;
    const params = new URLSearchParams({
      page: String(pageNum),
      limit: String(limit),
    });
    if (finalSearchVal) params.append("search", finalSearchVal);
    if (finalStatusVal && finalStatusVal.length > 0)
      params.append("status", finalStatusVal.join(","));
    if (finalDateRangeVal?.from)
      params.append("dateFrom", finalDateRangeVal.from.toISOString());
    if (finalDateRangeVal?.to)
      params.append("dateTo", finalDateRangeVal.to.toISOString());

    const res = await fetch(`/api/portals?${params.toString()}`);
    const data = await res.json();

    if (replace) {
      setPortals(data.portals);
    } else {
      setPortals((prev) => [...prev, ...data.portals]);
    }
    setTotal(data.total);
    setHasMore(pageNum * limit < data.total);
    setLoading(false);
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPortals(nextPage, false);
  }

  function clearFilters() {
    setSearch("");
    setStatus([]);
    setDateRange(undefined);
    setPage(1);

    // Call fetchPortals with explicit undefined for dateRange
    fetchPortals(1, true, "", [], undefined);
  }

  const anyFilterApplied =
    search ||
    (status && status.length > 0) ||
    (dateRange && (dateRange.from || dateRange.to));

  // When any filter is applied, force hasEverLoadedPortals to true for empty state logic
  const showNoPortalsFound =
    !loading && portals?.length === 0 && anyFilterApplied;
  const showNoPortalsYet =
    !loading &&
    portals?.length === 0 &&
    !anyFilterApplied &&
    hasEverLoadedPortals === false;

  const handlePortalCreated = () => {
    fetchPortals(1, true);
    setCreateDialogOpen(false);
    
    // Re-check portal creation limits after successful creation
    const recheckLimits = async () => {
      if (!session?.user || user?.role !== "freelancer") return;
      
      try {
        const response = await fetch('/api/plan-limits/check-portal-creation');
        const data = await response.json();
        
        setCanCreatePortal(data.allowed);
        if (!data.allowed) {
          setLimitMessage(data.reason || "Unable to create portal");
        } else {
          setLimitMessage(""); // Clear any previous limit messages
        }
      } catch (error) {
        console.error('Error rechecking portal limits:', error);
      }
    };
    
    recheckLimits();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation>
        <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center py-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold md:text-3xl text-white">My Portals</h1>
            <p className="text-gray-300 mt-2">
              Manage and view all your projects in one place
            </p>
          </div>
          {
            user?.role === "freelancer" && (
              <div className="w-full md:w-fit flex flex-col items-end">
                <PortalCreateDialog
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                  onPortalCreated={handlePortalCreated}
                />
              </div>
            )
          }
        </section>
      </TopNavigation>
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PlanLimitWarningBanner />

      {/* Portal Filters Section */}
      <section className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-6 w-full">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="flex h-10 items-center bg-[#f5f5f5] rounded-md px-4 py-2 min-w-0 flex-1 sm:min-w-[220px] sm:max-w-xs border border-[#ececec]">
            <Search className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
            <Input
              className="bg-transparent border-none shadow-none focus:ring-0 focus-visible:ring-0 p-0 text-sm h-6"
              placeholder="Search portals..."
              value={search}
              onChange={handleSearchChange}
              style={{ boxShadow: "none" }}
            />
          </div>
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center bg-[#f5f5f5] rounded-md px-4 py-2 text-sm font-normal text-gray-700 border border-[#ececec] h-10 min-w-0 sm:min-w-[150px] justify-start"
                type="button"
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                <span className="truncate">
                  {dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                    : "Choose date range"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {/* Status MultiSelect */}
          <div className="min-w-0 sm:min-w-[120px] h-10">
            <StatusMultiSelect
              options={[
                { label: "Active", value: "active" },
                { label: "Pending", value: "pending" },
                { label: "Archived", value: "archived" },
              ]}
              value={status}
              onChange={handleStatusChange}
              placeholder="Select status"
            />
          </div>
        </div>
        {/* Clear Filters */}
        {anyFilterApplied && (
          <button
            className="text-sm text-gray-500 hover:text-black underline whitespace-nowrap italic cursor-pointer h-10 px-3 flex items-center justify-center self-start sm:self-center"
            onClick={clearFilters}
            type="button"
          >
            Clear all filters
          </button>
        )}
      </section>

      {/* Portals Grid Section */}
      <section className="w-full">
        {/* Empty state logic */}
        {showNoPortalsFound && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <div className="text-2xl font-semibold mb-2">No portals found</div>
            <div className="mb-4">No portals found matching these filters.</div>
          </div>
        )}
        {showNoPortalsYet && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <div className="text-2xl font-semibold mb-2">No portals yet</div>
            <div className="mb-4">
              You don't have any portals yet. Click below to create your first
              portal.
            </div>
            <PortalCreateDialog
              open={createDialogOpen}
              onOpenChange={setCreateDialogOpen}
              onPortalCreated={handlePortalCreated}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {loading && portals?.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <PortalCardSkeleton key={i} />
              ))
            : portals?.map((portal) => (
                <PortalCard
                  key={portal.id}
                  cardImage={portal.thumbnail_url || DefaultPortalImage}
                  initials={
                    user?.role === "freelancer"
                      ? portal.clientName?.charAt(0) || "C"
                      : portal.freelancerName?.charAt(0) || "F"
                  }
                  title={portal.name}
                  status={
                    portal.status.charAt(0).toUpperCase() +
                    portal.status.slice(1)
                  }
                  statusColor={
                    portal.status === "active"
                      ? "#268E00"
                      : portal.status === "pending"
                        ? "#FFA500"
                        : "#9E9E9E"
                  }
                  clientName={portal.clientName}
                  freelancerName={portal.freelancerName}
                  lastUpdated={new Date(portal.updated_at).toLocaleDateString()}
                  newUpdates={`${portal.updatesCount} New Updates`}
                  onShareLink={() => {}}
                  onView={() => router.push(`/portal/${portal.id}`)}
                  dueDate={portal.dueDate ? format(new Date(portal.dueDate), "MMM d, yyyy") : "-"}
                  userImage={
                    user?.role === "freelancer"
                      ? portal.clientImage
                      : portal.freelancerImage
                  }
                />
              ))}
        </div>
        {hasMore && (
          <div className="flex justify-center py-4">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Load More Portals</>
              )}
            </Button>
          </div>
        )}
      </section>
    </main>
    </div>
  );
}
