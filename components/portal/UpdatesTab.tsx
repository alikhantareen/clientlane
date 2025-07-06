"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddUpdateModal } from "./AddUpdateModal";

interface UpdatesTabProps {
  portalId: string;
}

export function UpdatesTab({ portalId }: UpdatesTabProps) {
  const [updatesSearch, setUpdatesSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddUpdate = () => {
    setIsModalOpen(true);
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
        {/* Sample Update Items - Replace with actual data later */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">John Doe</span>
                <span className="text-sm text-gray-500">June 25, 2025</span>
                <span className="text-sm text-gray-500 ml-auto">3 comments</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                The logo concepts look great! I'll share some feedback soon.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">John Doe</span>
                <span className="text-sm text-gray-500">2 days ago</span>
                <span className="text-sm text-gray-500 ml-auto">2 days ago</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Three logo concepts are attached below for your review.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">PO</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900">Portal owner</span>
                <span className="text-sm text-gray-500">5 days ago</span>
                <span className="text-sm text-gray-500 ml-auto">5 days ago</span>
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 text-sm font-medium">
                  Initial project kickoff
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Welcome to the client portal for the logo redesign project. Updates and files will be shared here.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty state when no updates match search */}
        {updatesSearch && (
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
        onClose={() => setIsModalOpen(false)}
        portalId={portalId}
      />
    </div>
  );
} 