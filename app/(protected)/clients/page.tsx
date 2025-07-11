"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/clients-table/data-table";
import { createColumns } from "@/components/ui/clients-table/columns";
import { 
  ClientData, 
  ClientsTableFilters, 
  ClientAction, 
  ClientsApiResponse 
} from "@/lib/types";
import { toast } from "sonner";
import TopNavigation from "@/components/TopNavigation";

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<ClientsTableFilters>({
    search: "",
    status: "all",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch clients data
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== "all" && { status: filters.status }),
      });

      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }

      const data: ClientsApiResponse = await response.json();
      setClients(data.clients);
      setTotal(data.total);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters]);

  // Fetch clients on mount and when dependencies change
  useEffect(() => {
    if (status === "authenticated") {
      fetchClients();
    }
  }, [status, fetchClients]);

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: ClientsTableFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Handle client actions
  const handleClientAction = async (action: ClientAction, client: ClientData) => {
    switch (action) {
      case "view":
        // Navigate to client profile or modal
        toast.info(`View profile for ${client.name}`);
        break;
      
      case "resend-invite":
        try {
          const response = await fetch("/api/clients/resend-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: client.id }),
          });

          if (response.ok) {
            toast.success(`Invitation resent to ${client.name}`);
            // Refresh the clients list to update status if needed
            fetchClients();
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to resend invitation");
          }
        } catch (error) {
          console.error("Error resending invitation:", error);
          toast.error("Failed to resend invitation");
        }
        break;
      
      default:
        console.warn("Unknown action:", action);
    }
  };

  // Redirect if not authenticated or not a freelancer
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (session?.user && (session.user as any).role !== "freelancer") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only freelancers can access this page.</p>
        </div>
      </div>
    );
  }

  const columns = createColumns(handleClientAction);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation>
        <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center py-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold md:text-3xl text-white">My Clients</h1>
            <p className="text-gray-300 mt-2">
              Manage and view all your clients in one place
            </p>
          </div>
        </section>
      </TopNavigation>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DataTable
          columns={columns}
          data={clients}
          total={total}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
} 