"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, X, Upload, Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { toast } from "sonner";

interface AddUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  portalId: string;
  editUpdate?: {
    id: string;
    title: string;
    content: string;
    files: Array<{
      id: string;
      file_name: string;
      file_url: string;
      file_type: string;
      file_size: number;
    }>;
  };
}

export function AddUpdateModal({ isOpen, onClose, portalId, editUpdate }: AddUpdateModalProps) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{
    id: string;
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }>>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tiptap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-blue-600 underline',
        },
      }),
      TextStyle,
      Color,
    ],
    content: editUpdate?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 text-gray-700",
        placeholder: "Write your update here...",
      },
    },
  });

  // Set initial values when editing
  useEffect(() => {
    if (editUpdate) {
      setTitle(editUpdate.title);
      setExistingFiles(editUpdate.files);
      editor?.commands.setContent(editUpdate.content);
    } else {
      setTitle("");
      setExistingFiles([]);
      editor?.commands.setContent("");
    }
    setFiles([]);
    setFilesToRemove([]);
  }, [editUpdate, editor]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (fileId: string) => {
    setFilesToRemove(prev => [...prev, fileId]);
    setExistingFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmit = async () => {
    const content = editor?.getHTML() || "";
    if (!title.trim() || !content.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      
      if (editUpdate) {
        // For editing, include files to remove
        if (filesToRemove.length > 0) {
          formData.append("filesToRemove", JSON.stringify(filesToRemove));
        }
      } else {
        // For creating, include portal ID
        formData.append("portalId", portalId);
      }
      
      // Add new files to form data
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Make API call
      const response = await fetch(
        editUpdate ? `/api/updates/${editUpdate.id}` : "/api/updates",
        {
          method: editUpdate ? "PUT" : "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save update");
      }

      const data = await response.json();
      console.log("Update saved successfully:", data);
      
      // Show success toast
      toast.success(editUpdate ? "Update edited successfully" : "Update created successfully");
      
      // Reset form and close modal
      setTitle("");
      setFiles([]);
      setExistingFiles([]);
      setFilesToRemove([]);
      editor?.commands.setContent("");
      onClose();
    } catch (error) {
      console.error("Error saving update:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setFiles([]);
    setExistingFiles([]);
    setFilesToRemove([]);
    editor?.commands.setContent("");
    onClose();
  };

  // Toolbar component for the editor
  const EditorToolbar = ({ editor }: { editor: ReturnType<typeof useEditor> | null }) => {
    if (!editor) return null;

    return (
      <div className="border-b flex flex-wrap gap-1 p-2 bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
          className={editor.isActive("bold") ? "bg-gray-200" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
          className={editor.isActive("italic") ? "bg-gray-200" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
          className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
          className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={e => {
            e.preventDefault();
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              const previousUrl = editor.getAttributes('link').href || '';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-0">
          <DialogTitle className="text-2xl font-bold">
            {editUpdate ? "Edit Update" : "New Update"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter update title..."
              className="w-full"
            />
          </div>

          {/* Content Field with Rich Text Editor */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-base font-medium">
              Write an update...
            </Label>
            <div className="border rounded-lg overflow-hidden bg-white">
              <EditorToolbar editor={editor} />
              <div className="relative">
                <EditorContent
                  editor={editor}
                  className="min-h-[200px] prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror]:p-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_li]:ml-6"
                />
                {/* Placeholder when editor is empty */}
                {editor && editor.isEmpty && (
                  <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                    Write your update here...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span className="text-base font-medium text-gray-700">Attach files</span>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Choose Files
            </Button>

            {/* Existing Files (when editing) */}
            {existingFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Current files:</p>
                <div className="space-y-1">
                  {existingFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between bg-blue-50 p-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.file_name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExistingFile(file.id)}
                        className="text-gray-500 hover:text-red-500 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Files to Upload */}
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">New files to upload:</p>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                    >
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-gray-500 hover:text-red-500 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !title.trim() || !editor?.getHTML().trim()}
              className="bg-black text-white hover:bg-gray-800 cursor-pointer"
            >
              {isLoading ? (editUpdate ? "Updating..." : "Posting...") : (editUpdate ? "Update" : "Post")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 