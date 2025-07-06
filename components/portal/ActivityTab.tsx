import { User } from "lucide-react";

interface ActivityTabProps {
  portalId: string;
}

export function ActivityTab({ portalId }: ActivityTabProps) {
  return (
    <div className="text-center py-8">
      <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Activity
      </h3>
      <p className="text-gray-600">Activity feed coming soon...</p>
    </div>
  );
} 