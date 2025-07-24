"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { UpdateDetailsSkeleton } from "@/components/skeletons/UpdateDetailsSkeleton";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Loader2,
  Download,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  MoreVertical,
  Edit3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useUser } from "@/lib/contexts/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface UpdateFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
  files: UpdateFile[];
}

interface UpdateDetails {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: User;
  files: UpdateFile[];
  portal: {
    id: string;
    name: string;
    created_by: string;
    client_id: string;
  };
  replies: Reply[];
}

export default function UpdateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const portalId = params?.id as string;
  const updateId = params?.updateId as string;
  const { user } = useUser();

  const [update, setUpdate] = useState<UpdateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit and delete state
  const [editingReply, setEditingReply] = useState<Reply | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<Reply | null>(null);
  const [isDeletingReply, setIsDeletingReply] = useState(false);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]); // Track files to remove by ID
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(5); // Default to 5MB, will be updated
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);

  // Tiptap editor configuration for replies
  const replyEditor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
          class: "text-blue-600 underline",
        },
      }),
      TextStyle,
      Color,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[60px] p-3 text-gray-700",
      },
    },
  });

  const fetchUpdate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/updates/${updateId}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          // Show a toast notification for deleted updates
          toast.info("This update has been deleted and is no longer available.");
          throw new Error(data.message || "This update has been deleted or is no longer available.");
        }
        throw new Error(data.error || "Failed to fetch update");
      }

      setUpdate(data.update);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch update");
      console.error("Error fetching update:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdate();
    
    // Mark any notifications related to this update as read
    const markNotificationAsRead = async () => {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId: null, // We'll mark by link pattern
            markAllAsRead: false,
            markByLink: `/portal/${portalId}/update/${updateId}`
          }),
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    };
    
    markNotificationAsRead();
  }, [updateId, portalId]);

  // Fetch user's plan limits on component mount
  useEffect(() => {
    const fetchPlanLimits = async () => {
      try {
        setIsLoadingLimits(true);
        // Fetch portal-specific limits instead of user limits
        const response = await fetch(`/api/plan-limits?portalId=${portalId}`);
        if (response.ok) {
          const data = await response.json();
          setMaxFileSizeMB(data.plan.limits.maxFileSizeMB);
        }
      } catch (error) {
        console.error('Error fetching plan limits:', error);
        // Keep default 5MB if fetch fails
      } finally {
        setIsLoadingLimits(false);
      }
    };

    fetchPlanLimits();
  }, [portalId]);

  const handleBackClick = () => {
    router.push(`/portal/${portalId}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check file size limits before adding to state
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
    
    const validFiles = files.filter(file => {
      if (file.size > maxFileSizeBytes) {
        toast.error(`File "${file.name}" is too large. Maximum file size is ${maxFileSizeMB}MB.`);
        return false;
      }
      return true;
    });
    
    setReplyFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = replyEditor?.getHTML() || "";
    
    // Strip HTML tags and check for actual text content
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    
    if (!textContent && replyFiles.length === 0) {
      toast.error("Please enter some content or attach a file before sending.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("content", content);

      // Add files to form data
      replyFiles.forEach((file) => {
        formData.append("files", file);
      });

      let response;
      if (editingReply) {
        // Add files to remove to form data
        if (filesToRemove.length > 0) {
          formData.append("filesToRemove", JSON.stringify(filesToRemove));
        }

        // Update existing reply
        response = await fetch(`/api/replies/${editingReply.id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        // Create new reply
        response = await fetch(`/api/updates/${updateId}`, {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || (editingReply ? "Failed to update reply" : "Failed to post reply"));
      }

      // Show success toast
      toast.success(editingReply ? "Reply updated successfully" : "Reply posted successfully");

      // Reset form
      replyEditor?.commands.setContent("");
      setReplyFiles([]);
      setEditingReply(null);
      setFilesToRemove([]);

      // Refresh the update to show the changes
      await fetchUpdate();
    } catch (err) {
      console.error("Error submitting reply:", err);
      const errorMessage = err instanceof Error ? err.message : (editingReply ? "Failed to update reply" : "Failed to post reply");
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditReply = (reply: Reply) => {
    setEditingReply(reply);
    replyEditor?.commands.setContent(reply.content);
    setReplyFiles([]); // Clear files, we'll show existing files separately
    setFilesToRemove([]); // Reset files to remove
  };

  const handleCancelEdit = () => {
    setEditingReply(null);
    replyEditor?.commands.setContent("");
    setReplyFiles([]);
    setFilesToRemove([]);
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setFilesToRemove((prev) => [...prev, fileId]);
  };

  const handleRestoreExistingFile = (fileId: string) => {
    setFilesToRemove((prev) => prev.filter((id) => id !== fileId));
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;

    setIsDeletingReply(true);

    try {
      const response = await fetch(`/api/replies/${replyToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete reply");
      }

      // Show success toast
      toast.success("Reply deleted successfully");

      // Refresh the update to show the changes
      await fetchUpdate();

      // Close the dialog
      setDeleteDialogOpen(false);
      setReplyToDelete(null);
    } catch (err) {
      console.error("Error deleting reply:", err);
      setError(err instanceof Error ? err.message : "Failed to delete reply");
    } finally {
      setIsDeletingReply(false);
    }
  };

  const openDeleteDialog = (reply: Reply) => {
    setReplyToDelete(reply);
    setDeleteDialogOpen(true);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Toolbar component for the reply editor
  const ReplyEditorToolbar = ({
    editor,
  }: {
    editor: ReturnType<typeof useEditor> | null;
  }) => {
    if (!editor) return null;

    return (
      <div className="border-b flex flex-wrap gap-1 p-2 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              const previousUrl = editor.getAttributes("link").href || "";
              const url = window.prompt("Enter URL:", previousUrl);
              if (url && url !== previousUrl) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
          }}
          className={editor.isActive("link") ? "bg-blue-100" : ""}
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  // UpdateDetailsSkeleton has been moved to @/components/skeletons/UpdateDetailsSkeleton

  if (loading) {
    return <UpdateDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal
          </Button>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Update Not Found</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button 
                onClick={handleBackClick} 
                className="w-full bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Go Back to Portal
              </Button>
              <Button 
                onClick={fetchUpdate} 
                variant="outline" 
                className="w-full cursor-pointer"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!update) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to portal
          </Button>
        </div>
        
        <div className="text-center py-12">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Update Not Available</h2>
            <p className="text-gray-600 mb-6">This update may have been deleted or you may not have access to it.</p>
            <Button 
              onClick={handleBackClick} 
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Go Back to Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to updates
        </Button>
      </div>

      {/* Update Title */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
          {update.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">by {update.user.name}</span>
          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
          <span>
            {formatDistanceToNow(new Date(update.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* Thread Root - Original Update */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-semibold text-gray-900 text-sm">
                  {update.user.name}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {formatDistanceToNow(new Date(update.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 [&_p]:mb-3 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800">
                <div dangerouslySetInnerHTML={{ __html: update.content }} />
              </div>
              {/* Files */}
              {update.files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Attachments ({update.files.length})
                  </p>
                  <div className="space-y-2">
                    {update.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex-1 truncate"
                        >
                          {file.file_name}
                        </a>
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                          {formatFileSize(file.file_size)}
                        </span>
                        <a
                          href={file.file_url}
                          download
                          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-4">
        {update.replies.map((reply) => (
          <div key={reply.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  {reply.user.image ? (
                    <img
                      src={reply.user.image}
                      alt={reply.user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {getUserInitials(reply.user.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-semibold text-gray-900 text-sm">
                      {reply.user.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 [&_p]:mb-3 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800">
                    <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                  </div>
                  {/* Reply Files */}
                  {reply.files.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">
                        Attachments ({reply.files.length})
                      </p>
                      <div className="space-y-2">
                        {reply.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex-1 truncate"
                            >
                              {file.file_name}
                            </a>
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                              {formatFileSize(file.file_size)}
                            </span>
                            <a
                              href={file.file_url}
                              download
                              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors duration-200"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Three-dot menu - only show for reply author */}
                {user && user.id === reply.user.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleEditReply(reply)}
                        className="flex items-center gap-3 cursor-pointer py-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Reply</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(reply)}
                        className="flex items-center gap-3 cursor-pointer text-red-600 focus:text-red-600 py-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Reply</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Input Box - Fixed to bottom */}
      <div className="fixed -bottom-6 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Edit mode indicator */}
          {editingReply && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-800">
                  Editing reply by {editingReply.user.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 transition-colors duration-200"
                >
                  Cancel
                </Button>
              </div>
              {/* Show existing files from the reply being edited */}
              {editingReply.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-blue-700">Existing attachments:</p>
                  {editingReply.files.map((file) => {
                    const isMarkedForRemoval = filesToRemove.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          isMarkedForRemoval
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "bg-white border-blue-200 text-blue-600"
                        }`}
                      >
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span
                          className={`flex-1 text-sm font-medium ${isMarkedForRemoval ? "line-through" : ""}`}
                        >
                          {file.file_name}
                        </span>
                        <span className="text-xs opacity-75 bg-white px-2 py-1 rounded-full">
                          ({formatFileSize(file.file_size)})
                        </span>
                        {isMarkedForRemoval ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreExistingFile(file.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 rounded hover:bg-blue-100 transition-colors duration-200"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingFile(file.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-100 transition-colors duration-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmitReply} className="space-y-4">
            {/* Selected Files */}
            {replyFiles.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  {editingReply ? "Additional files:" : "Selected files:"}
                </p>
                <div className="space-y-2">
                  {replyFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 font-medium">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-100 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Input */}
            <div className="flex gap-3">
              <div className="flex-1 border border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                <ReplyEditorToolbar editor={replyEditor} />
                <div className="relative">
                  <EditorContent
                    editor={replyEditor}
                    className="min-h-[80px] prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px] [&_.ProseMirror]:p-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_li]:ml-6"
                  />
                  {/* Placeholder when editor is empty */}
                  {replyEditor && replyEditor.isEmpty && (
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                      {editingReply
                        ? "Edit your reply..."
                        : "Write your reply..."}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  id="reply-files"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="reply-files"
                  className="cursor-pointer p-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors duration-200 shadow-sm"
                >
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </label>
                <Button
                  type="submit"
                  disabled={
                    (() => {
                      const content = replyEditor?.getHTML() || "";
                      const textContent = content.replace(/<[^>]*>/g, '').trim();
                      return !textContent && replyFiles.length === 0;
                    })() || isSubmitting
                  }
                  className="px-6 py-3 rounded-xl flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 shadow-sm font-semibold cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {editingReply ? "Update" : "Send"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reply</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reply? This action cannot be
              undone.
              {replyToDelete?.files && replyToDelete.files.length > 0 && (
                <span className="block mt-2 text-sm">
                  This will also delete {replyToDelete?.files?.length} attached
                  file(s).
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingReply}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReply}
              disabled={isDeletingReply}
              className="cursor-pointer"
            >
              {isDeletingReply ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom padding to account for fixed reply input */}
      <div className="h-32"></div>
    </div>
  );
}
