import { Share2 } from "lucide-react";

interface SettingsTabProps {
  portalId: string;
}

export function SettingsTab({ portalId }: SettingsTabProps) {
  return (
    <div className="text-center py-8">
      <Share2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Settings
      </h3>
      <p className="text-gray-600">Portal settings coming soon...</p>
    </div>
  );
} 