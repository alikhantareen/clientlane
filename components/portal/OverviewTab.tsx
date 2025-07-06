interface OverviewTabProps {
  portal: {
    client: {
      name: string;
      email: string;
    };
    commentsCount: number;
    shared_links: any[];
  };
}

export function OverviewTab({ portal }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Portal Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Client Information
          </h4>
          <p className="text-sm text-gray-600">
            Name: {portal.client.name}
          </p>
          <p className="text-sm text-gray-600">
            Email: {portal.client.email}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Portal Stats
          </h4>
          <p className="text-sm text-gray-600">
            Comments: {portal.commentsCount}
          </p>
          <p className="text-sm text-gray-600">
            Shared Links: {portal.shared_links.length}
          </p>
        </div>
      </div>
    </div>
  );
} 