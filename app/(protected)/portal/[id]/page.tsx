"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Presentation,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import DefaultPortalImage from "@/public/defaultPortalImage.png";
import {
  OverviewTab,
  UpdatesTab,
  FilesTab,
  ActivityTab,
  DeletePortalModal,
} from "@/components/portal";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import PortalCreateDialog, {
  PortalFormValues,
} from "@/components/ui/portal-create-dialog";

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
    image: string | null;
  };
  freelancer: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  comments: any[];
  updates: any[];
  shared_links: any[];
  created_at: string;
  updated_at: string;
  commentsCount: number;
  initials: string;
  tags: string;
  dueDate: string;
  welcomeNote: string;
}

export default function PortalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { data: session } = useSession();
  const user = session?.user as any;

  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      fetchPortalData();
    }
  }, [id]);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/portals/${id}`);
      const data = await response.json();

      if (response.ok) {
        setPortal(data.portal);
      } else {
        setError(data.error || "Failed to fetch portal data");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDelete = async (portalId: string) => {
    try {
      const response = await fetch(`/api/portals/${portalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Portal deleted successfully!");
        setTimeout(() => {
          router.push("/portal");
        }, 1000);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete portal");
      }
    } catch (err) {
      toast.error("Failed to delete portal");
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

  const tabs = [
    { id: "overview", label: "Overview", icon: Calendar },
    { id: "updates", label: "Updates", icon: Presentation },
    { id: "files", label: "Files", icon: ExternalLink },
    { id: "activity", label: "Activity", icon: User },
  ];

  if (loading) {
    return (
      <div className="w-full mx-auto py-4 animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-3">
              <div className="w-48 h-8 bg-gray-200 rounded"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
              <div className="w-64 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mx-auto py-4">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/portal")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portals
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Portal
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPortalData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!portal) {
    return null;
  }

  return (
    <div className="w-full mx-auto py-4">
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

      {/* Portal Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
          {/* Portal Image */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={portal.thumbnail_url || DefaultPortalImage}
              alt={portal.name}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Portal Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">
                  {portal.name}
                </h1>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    className="text-white text-xs font-normal"
                    style={{ backgroundColor: getStatusColor(portal.status) }}
                  >
                    {portal.status.charAt(0).toUpperCase() +
                      portal.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Updated {new Date(portal.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {user?.role === "freelancer" ? (
                  <p className="text-gray-600 mb-3 break-words">
                    Client: {portal.client.name}
                  </p>
                ) : (
                  <p className="text-gray-600 mb-3 break-words">
                    Freelancer: {portal.freelancer.name}
                  </p>
                )}
                {portal.description && (
                  <p className="text-gray-700 text-sm leading-relaxed break-words">
                    {portal.description}
                  </p>
                )}
              </div>

              {/* Client Initials Box */}
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-lg">
                      {portal.initials}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    {user?.role === "freelancer"
                      ? portal.client.name.split(" ")[0]
                      : portal.freelancer.name.split(" ")[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b">
          <div className="flex overflow-x-auto scrollbar-hide pt-1 pl-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 sm:px-6 sm:py-4 text-sm font-medium border-b-2 transition-colors flex-shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? "border-black text-black bg-gray-50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === "overview" && (
            <OverviewTab
              portal={portal}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
          {activeTab === "updates" && <UpdatesTab portalId={portal.id} />}
          {activeTab === "files" && <FilesTab portalId={portal.id} />}
          {activeTab === "activity" && <ActivityTab portalId={portal.id} />}
        </div>
      </div>

      {/* Delete Portal Modal */}
      <DeletePortalModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        portal={portal}
        onDelete={handleDelete}
      />

      <PortalCreateDialog
        open={editModalOpen}
        onOpenChange={() => {
          setEditModalOpen(false);
        }}
        initialValues={{
          portalName: portal.name,
          clientEmail: portal.client.email,
          clientName: portal.client.name,
          portalDescription: portal.description,
          status: portal.status,
          tags: portal.tags || "",
          dueDate: portal.dueDate || "",
          welcomeNote: portal.welcomeNote || "",
          thumbnail_url: portal.thumbnail_url || "",
        }}
        portalId={portal.id}
        onSuccess={fetchPortalData}
      />
    </div>
  );
}
