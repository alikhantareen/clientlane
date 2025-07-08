"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CreatePortalPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [canCreatePortal, setCanCreatePortal] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const [checkingLimits, setCheckingLimits] = useState(true);
  const [form, setForm] = useState({
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
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  // Check if user can create portal on page load
  useEffect(() => {
    const checkLimits = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/plan-limits/check-portal-creation');
        const data = await response.json();
        
        setCanCreatePortal(data.allowed);
        if (!data.allowed) {
          setLimitMessage(data.reason || "Unable to create portal");
        }
      } catch (error) {
        console.error('Error checking portal limits:', error);
        setCanCreatePortal(false);
        setLimitMessage("Unable to verify plan limits. Please try again.");
      } finally {
        setCheckingLimits(false);
      }
    };

    checkLimits();
  }, [session]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, files, multiple, options } = e.target as any;
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
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
      formData.append("dueDate", dueDate ? dueDate.toISOString() : "");
      formData.append("welcomeNote", form.welcomeNote);

      const res = await fetch("/api/portal", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Portal has been created successfully!");
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
        setDueDate(undefined);
        setTimeout(() => {
          router.push("/portal");
        }, 1000);
      } else {
        const errorMessage = data.error || "Failed to create portal";
        toast.error(errorMessage);
        
        // If it's a limit error, refresh the limit check
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

  // If checking limits, show loading
  if (checkingLimits) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking plan limits...</p>
          </div>
        </div>
      </main>
    );
  }

  // If can't create portal, show warning
  if (!canCreatePortal) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/portal")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portals
          </Button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Cannot Create Portal</h1>
          <p className="text-red-700 mb-4">{limitMessage}</p>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push("/subscriptions")}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Upgrade Plan
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/portal")}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Back to Portals
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/portal")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portals
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Create a New Portal</h1>
      <form
        className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
        onSubmit={handleSubmit}
      >
        {/* Portal Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="portalName" className="mb-1">
            Portal Name *
          </Label>
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
          <Label htmlFor="clientEmail" className="mb-1">
            Client Email *
          </Label>
          <Input
            id="clientEmail"
            name="clientEmail"
            type="email"
            required
            placeholder="client@email.com"
            value={form.clientEmail}
            onChange={handleChange}
          />
        </div>
        {/* Client Name */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="clientName" className="mb-1">
            Client Name *
          </Label>
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
          <Label htmlFor="portalDescription" className="mb-1">
            Portal Description
          </Label>
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
          <Label htmlFor="status" className="mb-1">
            Status
          </Label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full h-9 px-3 py-2 rounded-md border text-base bg-white"
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        {/* Thumbnail / Logo */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="thumbnail" className="mb-1">
            Thumbnail / Logo
          </Label>
          <div className="w-full h-9 flex items-center border rounded-md px-3 py-2 bg-white">
            <Input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="p-0 border-0 h-auto"
            />
          </div>
        </div>
        {/* Tags / Category and Due Date in one row */}
        <>
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
                    (!dueDate ? "text-muted-foreground" : "")
                  }
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? (
                    format(dueDate, "PPP")
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
                  selected={dueDate}
                  onSelect={setDueDate}
                  captionLayout="dropdown"
                  fromYear={2000}
                  toYear={2100}
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
        {/* Custom Welcome Note */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="welcomeNote" className="mb-1">
            Custom Welcome Note
          </Label>
          <Textarea
            id="welcomeNote"
            name="welcomeNote"
            placeholder="Welcome message for your client..."
            value={form.welcomeNote}
            onChange={handleChange}
          />
        </div>
        <div className="md:col-span-2">
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Portal"}
          </Button>
        </div>
      </form>
    </main>
  );
}
