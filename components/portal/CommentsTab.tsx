import { MessageSquare } from "lucide-react";

interface CommentsTabProps {
  portalId: string;
}

export function CommentsTab({ portalId }: CommentsTabProps) {
  return (
    <div className="text-center py-8">
      <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Comments
      </h3>
      <p className="text-gray-600">Comment system coming soon...</p>
    </div>
  );
} 