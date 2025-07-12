import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface OverviewTabProps {
  portal: {
    id: string;
    client: {
      name: string;
      email: string;
    };
    freelancer: {
      name: string;
      email: string;
    };
    updates: any[];
    shared_links: any[];
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function OverviewTab({ portal, onEdit, onDelete }: OverviewTabProps) {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="space-y-4">
      {/* Header with Edit and Delete buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold">Portal Overview</h3>
        {user?.role === "freelancer" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            {user?.role === "freelancer"
              ? "Client Information"
              : "Freelancer Information"}
          </h4>
          {user?.role === "freelancer" ? (
            <>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Name:</span> {portal.client.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Email:</span> {portal.client.email}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Name:</span> {portal.freelancer.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">Email:</span> {portal.freelancer.email}
              </p>
            </>
          )}
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Portal Stats</h4>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Updates:</span> {portal.updates.length}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Shared Links:</span> {portal.shared_links.length}
          </p>
        </div>
      </div>
    </div>
  );
}
