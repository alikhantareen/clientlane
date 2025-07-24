import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

export function FreelancerDashboardSkeleton() {
  return (
    <DashboardLayout
      type="freelancer"
      stats={{
        totalPortals: 0,
        totalClients: 0,
        totalUpdates: 0,
        storageUsed: "0 MB"
      }}
      title="Dashboard"
      subtitle="Loading your dashboard..."
    >
      <div className="space-y-6">
        {/* First Row: Monthly Activity and Top Active Portals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-0 shadow-xl">
              <CardHeader>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second Row: Plan Usage and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="border-0 shadow-xl">
              <CardHeader>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default FreelancerDashboardSkeleton;
