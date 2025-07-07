"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddUpdateModal } from "./AddUpdateModal";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

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
  const [updatesSearch, setUpdatesSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/updates?portalId=${portalId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }
      
      const data = await response.json();
      setUpdates(data.updates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch updates");
      console.error("Error fetching updates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [portalId]);

  const handleAddUpdate = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Refresh updates after modal closes (in case an update was created)
    fetchUpdates();
  };

  // Filter updates based on search
  const filteredUpdates = updates.filter(update =>
    update.title.toLowerCase().includes(updatesSearch.toLowerCase()) ||
    update.content.toLowerCase().includes(updatesSearch.toLowerCase()) ||
    update.user.name.toLowerCase().includes(updatesSearch.toLowerCase())
  );

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <div className="space-y-6">
      {/* Search Bar and Add Button Row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        {/* Search Bar - Left aligned */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Add an update..."
              value={updatesSearch}
              onChange={(e) => setUpdatesSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Add Update Button - Right aligned */}
        <div className="flex-shrink-0">
          <Button
            onClick={handleAddUpdate}
            className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Update</span>
          </Button>
        </div>
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
                onClick={fetchUpdates} 
                variant="outline" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Updates List */}
        {!loading && !error && filteredUpdates.length > 0 && (
          <>
            {filteredUpdates.map((update) => (
              <div 
                key={update.id} 
                className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => router.push(`/portal/${portalId}/update/${update.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    {update.user.image ? (
                      <img 
                        src={update.user.image} 
                        alt={update.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {getUserInitials(update.user.name)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{update.user.name}</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-900 text-sm font-medium">
                        {update.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-500">Click to view details and replies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state when no updates exist */}
        {!loading && !error && updates.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No updates yet
              </h3>
              <p className="text-gray-600 mb-4">
                Be the first to share an update for this portal.
              </p>
              <Button onClick={handleAddUpdate} className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Update
              </Button>
            </div>
          </div>
        )}

        {/* Empty state when no updates match search */}
        {!loading && !error && updates.length > 0 && filteredUpdates.length === 0 && updatesSearch && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No updates found
            </h3>
            <p className="text-gray-600">
              No updates match your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Add Update Modal */}
      <AddUpdateModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        portalId={portalId}
      />
    </div>
  );
} 