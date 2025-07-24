import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export function ClientDashboardSkeleton() {
  return (
    <DashboardLayout
      type="client"
      stats={{
        assignedPortals: 0
      }}
      title="Dashboard"
      subtitle="Loading your dashboard..."
    >
      <div className="space-y-6">
        {/* First Row: My Project Portals and Recent Files */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-2 border-gray-300 shadow-xl">
              <CardHeader>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second Row: Recent Updates and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-2 border-gray-300 shadow-xl">
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ClientDashboardSkeleton;
