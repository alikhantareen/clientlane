"use client";

import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

interface PortalData {
  id: string;
  name: string;
  description: string;
  status: string;
  thumbnail_url: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EditPortalPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPortal, setFetchingPortal] = useState(true);
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [form, setForm] = useState({
    portalName: "",
    clientEmail: "",
    clientName: "",
    portalDescription: "",
    status: "active",
    thumbnail: undefined as File | undefined,
    tags: "",
    dueDate: "",
  });
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const portalId = params?.id as string;

  useEffect(() => {
    if (portalId) {
      fetchPortalData();
    }
  }, [portalId]);

  const fetchPortalData = async () => {
    try {
      setFetchingPortal(true);
      const response = await fetch(`/api/portals/${portalId}`);
      const data = await response.json();

      if (response.ok) {
        const portalData = data.portal;
        setPortal(portalData);
        
        // Prefill the form with existing data
        setForm({
          portalName: portalData.name || "",
          clientEmail: portalData.client.email || "",
          clientName: portalData.client.name || "",
          portalDescription: portalData.description || "",
          status: portalData.status || "active",
          thumbnail: undefined,
          tags: "",
          dueDate: "",
        });
      } else {
        toast.error(data.error || "Failed to fetch portal data");
        router.push("/portal");
      }
    } catch (err) {
      toast.error("Network error occurred");
      router.push("/portal");
    } finally {
      setFetchingPortal(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, files } = e.target as any;
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

      const res = await fetch(`/api/portals/${portalId}`, {
        method: "PUT",
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success("Portal updated successfully!");
        setTimeout(() => {
          router.push(`/portal/${portalId}`);
        }, 1000);
      } else {
        toast.error(data.error || "Failed to update portal");
      }
    } catch (err) {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPortal) {
    return (
      <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-48 h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                  <div className="w-full h-9 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!portal) {
    return null;
  }

  return (
    <main className="max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/portal/${portalId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Edit Portal</h1>
      
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
            disabled={true}
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
          {portal.thumbnail_url && (
            <div className="text-xs text-gray-500">
              Current: {portal.thumbnail_url.split('/').pop()}
            </div>
          )}
        </div>
        
        {/* Tags / Category and Due Date */}
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
        
        {/* Submit Button */}
        <div className="md:col-span-2">
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Updating Portal..." : "Update Portal"}
          </Button>
        </div>
      </form>
    </main>
  );
} 