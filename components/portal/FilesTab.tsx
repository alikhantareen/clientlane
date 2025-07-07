"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteFileModal } from "./DeleteFileModal";
import { formatDistanceToNow } from "date-fns";

interface File {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface FilesTabProps {
  portalId: string;
}

export function FilesTab({ portalId }: FilesTabProps) {
  const [filesSearchInput, setFilesSearchInput] = useState("");
  const [filesSearch, setFilesSearch] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setFilesSearchInput(value);

    // Clear existing timer
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timer
    searchTimeoutRef.current = setTimeout(() => {
      setFilesSearch(value);
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

  const fetchFiles = async (
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

      const response = await fetch(`/api/files?${searchParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();

      if (append) {
        setFiles((prev) => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }

      setCurrentPage(data.page);
      setTotalPages(data.pages);
      setTotalFiles(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch files");
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFiles(1, filesSearch);
  }, [portalId, filesSearch]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      fetchFiles(currentPage + 1, filesSearch, true);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      // Remove file from state
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
      setTotalFiles((prev) => prev - 1);

      // Show success message could be added here
    } catch (error) {
      console.error("Error deleting file:", error);
      // Show error message could be added here
    }
  };

  const handleDeleteClick = (file: File) => {
    setFileToDelete(file);
    setDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setDeleteModalOpen(false);
    setFileToDelete(null);
  };

  const handleDownload = (file: File) => {
    const link = document.createElement("a");
    link.href = file.file_url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return "📊";
    return "📄";
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search files..."
              value={filesSearchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* File count */}
        {totalFiles > 0 && (
          <div className="flex-shrink-0 text-sm text-gray-500">
            {totalFiles} {totalFiles === 1 ? "file" : "files"}
          </div>
        )}
      </div>

      {/* Files List */}
      <div className="space-y-4">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading files...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
              <Button
                onClick={() => fetchFiles(1, filesSearch)}
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Files List */}
        {!loading && !error && files.length > 0 && (
          <div className="grid gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <span className="text-3xl">
                      {getFileIcon(file.file_type)}
                    </span>
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {file.file_name}
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
                      <span>{formatFileSize(file.file_size)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {formatDistanceToNow(new Date(file.uploaded_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-2">
                        uploaded by {/* User Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                            {file.user.image ? (
                              <img
                                src={file.user.image}
                                alt={file.user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-sm font-medium">
                                {getUserInitials(file.user.name)}
                              </span>
                            )}
                          </div>
                        </div>{" "}
                        {file.user.name}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(file)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && !error && files.length > 0 && currentPage < totalPages && (
          <div className="flex justify-center py-4">
            <Button
              onClick={handleLoadMore}
              disabled={loadingMore}
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>Load More Files</>
              )}
            </Button>
          </div>
        )}

        {/* Empty state when no files exist */}
        {!loading && !error && files.length === 0 && !filesSearchInput && (
          <div className="text-center py-8">
            <div className="bg-gray-50 rounded-lg p-8">
              <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No files uploaded yet
              </h3>
              <p className="text-gray-600">
                Files uploaded to this portal will appear here.
              </p>
            </div>
          </div>
        )}

        {/* Empty state when no files match search */}
        {!loading && !error && files.length === 0 && filesSearchInput && (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No files found
            </h3>
            <p className="text-gray-600">
              No files match your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteFileModal
        isOpen={deleteModalOpen}
        onClose={handleModalClose}
        file={fileToDelete}
        onDelete={handleDeleteFile}
      />
    </div>
  );
}
