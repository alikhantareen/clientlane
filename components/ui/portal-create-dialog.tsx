"use client";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function PortalCreateDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canCreatePortal, setCanCreatePortal] = useState(true);
  const [limitMessage, setLimitMessage] = useState("");
  const { data: session } = useSession();
  const [form, setForm] = useState({
    portalName: "",
    clientEmail: "",
    clientName: "",
    portalDescription: "",
    status: "active",
    thumbnail: undefined,
    tags: [],
    dueDate: "",
    welcomeNote: "",
  });

  // Check if user can create portal on component mount
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
      }
    };

    checkLimits();
  }, [session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, files, multiple, options } = e.target as any;
    if (type === "file") {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else if (multiple) {
      setForm((prev) => ({ ...prev, [name]: Array.from(options).filter((o: any) => o.selected).map((o: any) => o.value) }));
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
      form.tags.forEach((tag: string) => formData.append("tags", tag));
      formData.append("dueDate", form.dueDate);
      formData.append("welcomeNote", form.welcomeNote);

      const res = await fetch("/api/portal", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Portal created successfully!");
        setForm({
          portalName: "",
          clientEmail: "",
          clientName: "",
          portalDescription: "",
          status: "active",
          thumbnail: undefined,
          tags: [],
          dueDate: "",
          welcomeNote: "",
        });
        setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="w-full md:w-fit">
          <Button 
            disabled={!canCreatePortal}
            className="bg-black text-white hover:bg-gray-800 hover:text-white cursor-pointer w-full md:w-fit disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canCreatePortal ? limitMessage : "Create a new portal"}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Portal
          </Button>
          {!canCreatePortal && (
            <p className="text-sm text-red-600 mt-1">{limitMessage}</p>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Portal</DialogTitle>
          <DialogDescription>Fill in the details below to create a new client portal.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Portal Name */}
          <div>
            <Label htmlFor="portalName">Portal Name *</Label>
            <Input id="portalName" name="portalName" required placeholder="e.g. Acme Project" value={form.portalName} onChange={handleChange} />
          </div>
          {/* Client Email */}
          <div>
            <Label htmlFor="clientEmail">Client Email *</Label>
            <Input id="clientEmail" name="clientEmail" type="email" required placeholder="client@email.com" value={form.clientEmail} onChange={handleChange} />
          </div>
          {/* Client Name */}
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input id="clientName" name="clientName" placeholder="e.g. John Doe" value={form.clientName} onChange={handleChange} />
          </div>
          {/* Portal Description */}
          <div>
            <Label htmlFor="portalDescription">Portal Description</Label>
            <Textarea id="portalDescription" name="portalDescription" placeholder="Short summary or notes..." value={form.portalDescription} onChange={handleChange} />
          </div>
          {/* Status Dropdown */}
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" value={form.status} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {/* Thumbnail / Logo */}
          <div>
            <Label htmlFor="thumbnail">Thumbnail / Logo</Label>
            <Input id="thumbnail" name="thumbnail" type="file" accept="image/*" onChange={handleChange} />
          </div>
          {/* Tags / Category */}
          <div>
            <Label htmlFor="tags">Tags / Category</Label>
            <select id="tags" name="tags" multiple value={form.tags} onChange={handleChange} className="w-full border rounded-md px-3 py-2">
              <option value="branding">Branding</option>
              <option value="development">Development</option>
              <option value="strategy">Strategy</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
          </div>
          {/* Custom Welcome Note */}
          <div>
            <Label htmlFor="welcomeNote">Custom Welcome Note</Label>
            <Textarea id="welcomeNote" name="welcomeNote" placeholder="Welcome message for your client..." value={form.welcomeNote} onChange={handleChange} />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800" disabled={loading}>
              {loading ? "Creating..." : "Create Portal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 