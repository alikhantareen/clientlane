import { ExternalLink } from "lucide-react";

interface FilesTabProps {
  portalId: string;
}

export function FilesTab({ portalId }: FilesTabProps) {
  return (
    <div className="text-center py-8">
      <ExternalLink className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Files
      </h3>
      <p className="text-gray-600">File management coming soon...</p>
    </div>
  );
} 