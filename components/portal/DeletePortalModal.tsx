"use client";

import { useState, useEffect } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Portal {
  id: string;
  name: string;
  description: string;
  status: string;
  client: {
    name: string;
    email: string;
  };
}

interface DeletePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  portal: Portal | null;
  onDelete: (portalId: string) => Promise<void>;
}

export function DeletePortalModal({ isOpen, onClose, portal, onDelete }: DeletePortalModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  // Clear confirmation text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText("");
    }
  }, [isOpen]);

  // Check if the confirmation text matches the portal name
  const isConfirmationValid = portal && confirmationText === portal.name;

  const handleDelete = async () => {
    if (!portal) return;

    try {
      setIsDeleting(true);
      await onDelete(portal.id);
      onClose();
    } catch (error) {
      console.error("Error deleting portal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#268E00";
      case "pending":
        return "#FFA500";
      case "archived":
        return "#9E9E9E";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Portal
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this portal? This action cannot be undone and will permanently remove:
          </p>

          <ul className="text-sm text-gray-600 mb-4 pl-5 space-y-1">
            <li className="list-disc">All portal files and updates</li>
            <li className="list-disc">All client communications</li>
            <li className="list-disc">All shared links and access</li>
            <li className="list-disc">All portal activity history</li>
          </ul>

          {portal && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {portal.name.split(' ').map(word => word[0]).join('').toUpperCase() || 'P'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 mb-1 break-words">
                    {portal.name}
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: getStatusColor(portal.status) }}
                    />
                    <span className="text-sm text-gray-500 capitalize">
                      {portal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Client: {portal.client.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700 font-medium">
              ⚠️ This action is irreversible. Type the portal name to confirm deletion.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmationText" className="text-sm font-medium">
              Type "{portal?.name}" to confirm:
            </Label>
            <Input
              id="confirmationText"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Enter portal name"
              disabled={isDeleting}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="sm:order-1 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmationValid}
            className="sm:order-2 flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting Portal...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Portal
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 