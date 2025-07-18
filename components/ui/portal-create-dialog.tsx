"use client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PortalFormValues {
  portalName: string;
  clientEmail: string;
  clientName: string;
  portalDescription: string;
  status: string;
  thumbnail?: File | undefined;
  tags: string;
  dueDate: string;
  welcomeNote: string;
}

interface PortalCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Partial<PortalFormValues> & { thumbnail_url?: string };
  portalId?: string;
  onSuccess?: () => void;
  onPortalCreated?: () => void;
}

export default function PortalCreateDialog({
  open,
  onOpenChange,
  initialValues,
  portalId,
  onSuccess,
  onPortalCreated,
}: PortalCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [canCreatePortal, setCanCreatePortal] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const { data: session } = useSession();
  const [form, setForm] = useState<PortalFormValues>({
    portalName: initialValues?.portalName || "",
    clientEmail: initialValues?.clientEmail || "",
    clientName: initialValues?.clientName || "",
    portalDescription: initialValues?.portalDescription || "",
    status: initialValues?.status || "active",
    thumbnail: undefined,
    tags: initialValues?.tags || "",
    dueDate: initialValues?.dueDate || "",
    welcomeNote: initialValues?.welcomeNote || "",
  });

  useEffect(() => {
    if (initialValues) {
      setForm((prev) => ({
        ...prev,
        portalName: initialValues.portalName || "",
        clientEmail: initialValues.clientEmail || "",
        clientName: initialValues.clientName || "",
        portalDescription: initialValues.portalDescription || "",
        status: initialValues.status || "active",
        tags: initialValues.tags || "",
        dueDate: initialValues.dueDate
          ? new Date(initialValues.dueDate).toISOString()
          : "",
        welcomeNote: initialValues.welcomeNote || "",
        thumbnail: undefined, // always reset file input since we can't pre-populate file inputs
      }));
    }
  }, [initialValues, open]);

  // Check if user can create portal on component mount
  useEffect(() => {
    const checkLimits = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch("/api/plan-limits/check-portal-creation");
        const data = await response.json();

        setCanCreatePortal(data.allowed);
        if (!data.allowed) {
          setLimitMessage(data.reason || "Unable to create portal");
        }
      } catch (error) {
        console.error("Error checking portal limits:", error);
      }
    };

    checkLimits();
  }, [session]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, files } = e.target as any;
    if (type === "file") {
      const file = files[0];
      if (file) {
        // Check file size limits for thumbnail
        const maxFileSizeMB = 5; // Free plan limit
        const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
        
        if (file.size > maxFileSizeBytes) {
          toast.error(`File "${file.name}" is too large. Maximum file size is ${maxFileSizeMB}MB.`);
          return;
        }
      }
      setForm((prev) => ({ ...prev, [name]: file }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.portalName);
      formData.append("clientEmail", form.clientEmail);
      formData.append("clientName", form.clientName);
      formData.append("description", form.portalDescription);
      formData.append("status", form.status);
      if (form.thumbnail) formData.append("thumbnail", form.thumbnail);
      if (form.tags) formData.append("tags", form.tags);
      formData.append("dueDate", form.dueDate);
      formData.append("welcomeNote", form.welcomeNote);

      let res, data;
      if (portalId) {
        // Edit mode
        res = await fetch(`/api/portals/${portalId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        // Create mode
        res = await fetch("/api/portal", {
          method: "POST",
          body: formData,
        });
      }
      data = await res.json();
      if (res.ok) {
        toast.success(
          portalId
            ? "Portal updated successfully!"
            : "Portal created successfully!"
        );
        setForm({
          portalName: "",
          clientEmail: "",
          clientName: "",
          portalDescription: "",
          status: "active",
          thumbnail: undefined,
          tags: "",
          dueDate: "",
          welcomeNote: "",
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
        if (onPortalCreated) onPortalCreated();
      } else {
        const errorMessage =
          data.error ||
          (portalId ? "Failed to update portal" : "Failed to create portal");
        toast.error(errorMessage);
        if (data.upgradeRequired) {
          setCanCreatePortal(false);
          setLimitMessage(errorMessage);
        }
      }
    } catch (err) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!portalId && canCreatePortal && (
        <DialogTrigger asChild>
          <div className="w-full md:w-fit">
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white cursor-pointer w-full md:w-fit"
              title="Create a new portal"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Portal
            </Button>
          </div>
        </DialogTrigger>
      )}
      {!portalId && !canCreatePortal && (
        <div className="w-full md:w-fit">
          <div className="flex items-center gap-2">
            <Button
              disabled
              className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white cursor-pointer w-full md:w-fit disabled:opacity-50 disabled:cursor-not-allowed"
              title={limitMessage}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Portal
            </Button>
            {limitMessage && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-5 w-5 text-red-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{limitMessage}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {portalId ? "Edit Portal" : "Create a New Portal"}
          </DialogTitle>
          <DialogDescription>
            {portalId
              ? "Update the details below to edit this client portal."
              : "Fill in the details below to create a new client portal."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
          onSubmit={handleSubmit}
        >
          {/* Portal Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="portalName">Portal Name *</Label>
            <Input
              id="portalName"
              name="portalName"
              required
              placeholder="e.g. Acme Project"
              value={form.portalName}
              onChange={handleChange}
            />
          </div>
          {/* Client Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="clientEmail">Client Email *</Label>
            <Input
              id="clientEmail"
              name="clientEmail"
              type="email"
              required
              placeholder="client@email.com"
              value={form.clientEmail}
              onChange={handleChange}
              disabled={!!portalId}
            />
          </div>
          {/* Client Name */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              name="clientName"
              required
              placeholder="e.g. John Doe"
              value={form.clientName}
              onChange={handleChange}
            />
          </div>
          {/* Portal Description */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="portalDescription">Portal Description</Label>
            <Textarea
              id="portalDescription"
              name="portalDescription"
              placeholder="Short summary or notes..."
              value={form.portalDescription}
              onChange={handleChange}
            />
          </div>
          {/* Status Dropdown */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 h-9"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {/* Thumbnail / Logo */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="thumbnail">Thumbnail / Logo</Label>
            <Input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
            {portalId && initialValues?.thumbnail_url && (
              <div className="text-xs text-gray-500">
                Current: {initialValues.thumbnail_url.split("/").pop()}
              </div>
            )}
          </div>
          {/* Tags / Category */}
          <div className="flex flex-col gap-2 md:col-span-1">
            <Label htmlFor="tags" className="mb-1">
              Tags / Category
            </Label>
            <select
              id="tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full h-9 px-3 py-2 rounded-md border text-base bg-white"
            >
              <option value="">Select a tag</option>
              <option value="branding">Branding</option>
              <option value="development">Development</option>
              <option value="strategy">Strategy</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          {/* Due Date */}
          <div className="flex flex-col gap-2 md:col-span-1">
            <Label htmlFor="dueDate" className="mb-1">
              Due Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={
                    "w-full h-9 px-3 py-2 rounded-md border text-base justify-start text-left font-normal bg-white " +
                    (!form.dueDate ? "text-muted-foreground" : "")
                  }
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.dueDate ? (
                    format(new Date(form.dueDate), "PPP")
                  ) : (
                    <span className="text-muted-foreground">
                      Select due date
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.dueDate ? new Date(form.dueDate) : undefined}
                  onSelect={(date) =>
                    setForm({ ...form, dueDate: date?.toISOString() || "" })
                  }
                  captionLayout="dropdown"
                  fromYear={2000}
                  toYear={2100}
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Custom Welcome Note */}
          {!portalId && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="welcomeNote">Custom Welcome Note</Label>
              <Textarea
                id="welcomeNote"
                name="welcomeNote"
                placeholder="Welcome message for your client..."
                value={form.welcomeNote}
                onChange={handleChange}
              />
            </div>
          )}
                    <div className="md:col-span-2 flex flex-col gap-2">
            <DialogFooter>
              <Button
                type="button"
                className="w-fit cursor-pointer"
                disabled={loading}
                onClick={() => onOpenChange(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  className="w-fit bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  disabled={loading || !canCreatePortal}
                >
                  {loading
                    ? portalId
                      ? "Updating..."
                      : "Creating..."
                    : portalId
                      ? "Update Portal"
                      : "Create Portal"}
                </Button>
                {limitMessage && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-red-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{limitMessage}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
