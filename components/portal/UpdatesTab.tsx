"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Plus,
  Loader2,
  MessageCircle,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddUpdateModal } from "./AddUpdateModal";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface Update {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  files: Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }>;
}

interface UpdatesTabProps {
  portalId: string;
}

export function UpdatesTab({ portalId }: UpdatesTabProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const [updatesSearchInput, setUpdatesSearchInput] = useState("");
  const [updatesSearch, setUpdatesSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | undefined>(
    undefined
  );
  const [deleteUpdateId, setDeleteUpdateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setUpdatesSearchInput(value);

    // Clear existing timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timer
    searchTimeoutRef.current = setTimeout(() => {
      setUpdatesSearch(value);
    }, 500); // 500ms delay
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchUpdates = async (
    page: number = 1,
    searchQuery: string = "",
    append: boolean = false
  ) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const searchParams = new URLSearchParams({
        portalId,
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/updates?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }

      const data = await response.json();

      if (append) {
        setUpdates((prev) => [...prev, ...data.updates]);
      } else {
        setUpdates(data.updates || []);
      }

      setCurrentPage(data.page);
      setTotalPages(data.pages);
      setTotalUpdates(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch updates");
      console.error("Error fetching updates:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUpdates(1, updatesSearch);
  }, [portalId, updatesSearch]);

  const handleAddUpdate = () => {
    setEditingUpdate(undefined);
    setIsModalOpen(true);
  };

  const handleEditUpdate = (update: Update) => {
    setEditingUpdate(update);
    setIsModalOpen(true);
  };

  const handleDeleteUpdate = (updateId: string) => {
    setDeleteUpdateId(updateId);
  };

  const confirmDelete = async () => {
    if (!deleteUpdateId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/updates/${deleteUpdateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete update");
      }

      // Remove the deleted update from the list
      setUpdates((prev) =>
        prev.filter((update) => update.id !== deleteUpdateId)
      );
      setTotalUpdates((prev) => prev - 1);
      setDeleteUpdateId(null);
      toast.success("Update deleted successfully");
    } catch (error) {
      console.error("Error deleting update:", error);
      setError("Failed to delete update");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteUpdateId(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUpdate(undefined);
    // Refresh updates after modal closes (in case an update was created/edited)
    fetchUpdates(1, updatesSearch);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchUpdates(currentPage + 1, updatesSearch, true);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Search Bar and Add Button Row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        {/* Search Bar - Left aligned */}
        <div className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search for an update..."
              value={updatesSearchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          {/* Update count */}
          {totalUpdates > 0 && (
            <div className="flex-shrink-0 text-sm text-gray-500 flex items-center gap-2">
              {totalUpdates} {totalUpdates === 1 ? "update" : "updates"}
            </div>
          )}
        </div>

        {/* Add Update Button - Right aligned */}
        {user?.role === "freelancer" && (
          <div className="flex-shrink-0">
            <Button
              onClick={handleAddUpdate}
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Update</span>
            </Button>
          </div>
        )}
      </div>

      {/* Updates List */}
      <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading updates...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={() => fetchUpdates(1, updatesSearch)}
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Updates List */}
        {!loading && !error && updates.length > 0 && (
          <>
            {updates.map((update) => (
              <div
                key={update.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 relative"
              >
                <div className="flex items-start gap-4">
                  {/* Profile Section */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                      {update.user.image ? (
                        <img
                          src={update.user.image}
                          alt={update.user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {getUserInitials(update.user.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    {/* User Info Row */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-semibold text-gray-900 text-sm">
                        {update.user.name}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {formatDistanceToNow(new Date(update.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Update Content */}
                    <div className="space-y-3">
                      <div
                        className="group cursor-pointer"
                        onClick={() =>
                          router.push(`/portal/${portalId}/update/${update.id}`)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                            {update.title}
                          </h3>
                          <svg 
                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors duration-200 opacity-0 group-hover:opacity-100" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-600 transition-colors duration-200">
                          Click to read full update
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Three dots dropdown - Only show for the freelancer who created the update */}
                  {user && user.id === update.user.id && (
                    <div className="absolute top-4 right-4 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full transition-colors duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleEditUpdate(update)}
                            className="flex items-center gap-3 cursor-pointer py-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            <span>Edit Update</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUpdate(update.id)}
                            className="flex items-center gap-3 cursor-pointer text-red-600 focus:text-red-600 py-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete Update</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Load More Button */}
        {!loading &&
          !error &&
          updates.length > 0 &&
          currentPage < totalPages && (
            <div className="flex justify-center py-4">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load More Updates</>
                )}
              </Button>
            </div>
          )}

        {/* Empty state when no updates exist */}
        {!loading && !error && updates.length === 0 && !updatesSearchInput && (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No updates yet
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Updates shared to this portal will appear here.
              </p>
              {user?.role === "freelancer" && (
                <>
                  <Button
                    onClick={handleAddUpdate}
                    className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Update
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Empty state when no updates match search */}
        {!loading && !error && updates.length === 0 && updatesSearchInput && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No updates found
            </h3>
            <p className="text-sm text-gray-400">
              No updates match your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Update Modal */}
      <AddUpdateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        portalId={portalId}
        editUpdate={editingUpdate}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={!!deleteUpdateId}
        onOpenChange={() => setDeleteUpdateId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this update? This action cannot be
              undone. All replies and associated files will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {isDeleting ? "Deleting..." : "Delete Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
