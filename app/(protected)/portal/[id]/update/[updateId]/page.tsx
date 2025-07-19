"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
      if (!response.ok) {
        throw new Error("Failed to fetch update");
      }

      const data = await response.json();
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
  }, [updateId]);

  const handleBackClick = () => {
    router.push(`/portal/${portalId}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Check file size limits before adding to state
    const maxFileSizeMB = 5; // Free plan limit
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
    if (!content.trim()) {
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

  // Skeleton component for loading state
  const UpdateDetailsSkeleton = () => (
    <div className="w-full mx-auto p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Update Title Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="h-8 w-3/4 bg-gray-300 rounded mb-2"></div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
          <div className="h-4 w-1 bg-gray-300 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>

      {/* Thread Root Skeleton */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-20 bg-gray-300 rounded"></div>
                <div className="h-3 w-16 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-300 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
              </div>
              {/* Attachments Skeleton */}
              <div className="mt-4 space-y-2">
                <div className="h-4 w-24 bg-gray-300 rounded"></div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <div className="h-3 w-32 bg-gray-300 rounded flex-1"></div>
                    <div className="h-3 w-12 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Replies Skeleton */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg border">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-16 bg-gray-300 rounded"></div>
                    <div className="h-3 w-14 bg-gray-300 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-300 rounded"></div>
                    <div className="h-4 w-4/5 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom padding */}
      <div className="h-32"></div>
    </div>
  );

  if (loading) {
    return <UpdateDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchUpdate} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!update) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Update not found</p>
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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to updates
        </Button>
      </div>

      {/* Update Title */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {update.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>by {update.user.name}</span>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(update.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>

      {/* Thread Root - Original Update */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              {update.user.image ? (
                <img
                  src={update.user.image}
                  alt={update.user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {getUserInitials(update.user.name)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-medium text-gray-900">
                  {update.user.name}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(update.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="prose prose-sm max-w-none text-sm [&_p]:mb-3 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_a]:text-blue-600 [&_a]:underline">
                <div dangerouslySetInnerHTML={{ __html: update.content }} />
              </div>
              {/* Files */}
              {update.files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    Attachments:
                  </p>
                  <div className="space-y-2">
                    {update.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                      >
                        <Paperclip className="w-4 h-4 text-gray-500" />
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline flex-1"
                        >
                          {file.file_name}
                        </a>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)}
                        </span>
                        <a
                          href={file.file_url}
                          download
                          className="text-gray-500 hover:text-gray-700"
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
          <div key={reply.id} className="bg-gray-50 rounded-lg border">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  {reply.user.image ? (
                    <img
                      src={reply.user.image}
                      alt={reply.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-medium">
                      {getUserInitials(reply.user.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {reply.user.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(reply.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-sm [&_p]:mb-3 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-6 [&_a]:text-blue-600 [&_a]:underline">
                    <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                  </div>
                  {/* Reply Files */}
                  {reply.files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-600">
                        Attachments:
                      </p>
                      <div className="space-y-1">
                        {reply.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 p-2 bg-white rounded"
                          >
                            <Paperclip className="w-4 h-4 text-gray-500" />
                            <a
                              href={file.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline flex-1"
                            >
                              {file.file_name}
                            </a>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.file_size)}
                            </span>
                            <a
                              href={file.file_url}
                              download
                              className="text-gray-500 hover:text-gray-700"
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
                        className="w-8 h-8 p-0 text-gray-500 hover:text-gray-700 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4 cursor-pointer" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleEditReply(reply)}
                        className="cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 mr-2 cursor-pointer" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(reply)}
                        className="text-red-600 hover:text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2 cursor-pointer" />
                        Delete
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
      <div className="fixed -bottom-6 left-0 right-0 bg-white border-t z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Edit mode indicator */}
          {editingReply && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">
                  Editing reply by {editingReply.user.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-blue-700 hover:text-blue-800 cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
              {/* Show existing files from the reply being edited */}
              {editingReply.files.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-blue-700">Existing attachments:</p>
                  {editingReply.files.map((file) => {
                    const isMarkedForRemoval = filesToRemove.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        className={`flex items-center gap-2 p-2 rounded ${
                          isMarkedForRemoval
                            ? "bg-red-50 border border-red-200 text-red-600"
                            : "bg-white border border-blue-200 text-blue-600"
                        }`}
                      >
                        <Paperclip className="w-3 h-3" />
                        <span
                          className={`flex-1 text-xs ${isMarkedForRemoval ? "line-through" : ""}`}
                        >
                          {file.file_name}
                        </span>
                        <span className="text-xs opacity-75">
                          ({formatFileSize(file.file_size)})
                        </span>
                        {isMarkedForRemoval ? (
                          <button
                            type="button"
                            onClick={() => handleRestoreExistingFile(file.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingFile(file.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
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

          <form onSubmit={handleSubmitReply} className="space-y-3">
            {/* Selected Files */}
            {replyFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">
                  {editingReply ? "Additional files:" : "Selected files:"}
                </p>
                <div className="space-y-1">
                  {replyFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 text-xs"
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
              <div className="flex-1 border rounded-lg overflow-hidden bg-white">
                <ReplyEditorToolbar editor={replyEditor} />
                <div className="relative">
                  <EditorContent
                    editor={replyEditor}
                    className="min-h-[60px] prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:p-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_li]:ml-6"
                  />
                  {/* Placeholder when editor is empty */}
                  {replyEditor && replyEditor.isEmpty && (
                    <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
                      {editingReply
                        ? "Edit your reply..."
                        : "Write your reply..."}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
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
                  className="cursor-pointer p-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                >
                  <Paperclip className="w-4 h-4 text-gray-500" />
                </label>
                <Button
                  type="submit"
                  disabled={!replyEditor?.getHTML().trim() || isSubmitting}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
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
