"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanLimitWarningBanner } from "@/components/ui";
import { ActivityChart } from "@/components/ui/ActivityChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  FolderOpen, 
  FileText, 
  HardDrive, 
  TrendingUp, 
  Calendar,
  Activity,
  Eye,
  Clock,
  Crown,
  ArrowUpRight,
  Plus,
  BarChart3
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { DashboardLayout } from "./DashboardLayout";

interface FreelancerDashboardData {
  overview: {
    totalPortals: number;
    totalClients: number;
    totalUpdates: number;
    storageUsed: string;
  };
  monthlyActivity: {
    month: string;
    updates: number;
    clients: number;
  }[];
  topPortals: {
    id: string;
    name: string;
    clientName: string;
    updateCount: number;
    lastUpdated: string;
    status: string;
  }[];
  planUsage: {
    currentPlan: string;
    planId: string;
    isActive: boolean;
    endsAt?: string;
  };
  recentActivity: {
    id: string;
    type: string;
    message: string;
    portalName: string;
    userName: string;
    createdAt: string;
  }[];
  pagination?: {
    activity: {
      currentPage: number;
      totalItems: number;
      totalPages: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export function FreelancerDashboard() {
  const [data, setData] = useState<FreelancerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchData = async (page: number = 1) => {
    try {
      setActivityLoading(true);
      const response = await fetch(`/api/dashboard/freelancer?activityPage=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activityPage);
  }, [activityPage]);

  const handleActivityPageChange = (page: number) => {
    setActivityPage(page);
  };

  if (loading) {
    return <FreelancerDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Error loading dashboard</h3>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'archived':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <DashboardLayout
      type="freelancer"
      stats={{
        totalPortals: data.overview.totalPortals,
        totalClients: data.overview.totalClients,
        totalUpdates: data.overview.totalUpdates,
        storageUsed: data.overview.storageUsed
      }}
      title="Dashboard"
      subtitle="Welcome back! Here's an overview of your client portal activity."
    >
      <div className="space-y-6">
        <PlanLimitWarningBanner />

        {/* First Row: Monthly Activity and Top Active Portals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Activity Chart */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Activity
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Track your updates and new clients over the last 12 months
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityChart
                data={data.monthlyActivity}
                title=""
                description=""
              />
            </CardContent>
          </Card>

          {/* Top Portals */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5" />
                Top Active Portals
              </CardTitle>
              <p className="text-sm text-gray-600">
                Your most active portals by update count
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPortals.length > 0 ? (
                  data.topPortals.map((portal) => (
                    <div key={portal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{portal.name}</h4>
                          <Badge className={getStatusColor(portal.status)}>
                            {portal.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{portal.clientName}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {portal.updateCount} updates
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(portal.lastUpdated), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/portal/${portal.id}`}>
                        <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No portals created yet</p>
                    <Link href="/portal/create">
                      <Button className="mt-4 gap-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Create Your First Portal
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Plan Usage and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Plan Usage */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Crown className="h-5 w-5" />
                Plan Usage
              </CardTitle>
              <p className="text-sm text-gray-600">
                Your current subscription plan
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{data.planUsage.currentPlan}</h4>
                    <p className="text-sm text-gray-600">
                      {data.planUsage.isActive ? 'Active subscription' : 'No active subscription'}
                    </p>
                    {data.planUsage.endsAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ends {formatDistanceToNow(new Date(data.planUsage.endsAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/subscriptions">
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        Manage Plan
                      </Button>
                    </Link>
                    {data.planUsage.planId === 'free' && (
                      <Link href="/subscriptions">
                        <Button size="sm" className="gap-2 cursor-pointer">
                          <ArrowUpRight className="h-4 w-4" />
                          Upgrade
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.overview.totalPortals}</p>
                    <p className="text-xs text-gray-500">Portals Created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{data.overview.totalClients}</p>
                    <p className="text-xs text-gray-500">Clients Added</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <p className="text-sm text-gray-600">
                Latest actions across your portals
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex flex-col">
                {activityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : data.recentActivity.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {data.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {activity.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{activity.userName}</span>{' '}
                              {activity.message} in{' '}
                              <span className="font-medium">{activity.portalName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {data.pagination?.activity && (
                      <div className="pt-4 border-t mt-4">
                        <Pagination
                          currentPage={data.pagination.activity.currentPage}
                          totalPages={data.pagination.activity.totalPages}
                          totalItems={data.pagination.activity.totalItems}
                          itemsPerPage={data.pagination.activity.itemsPerPage}
                          onPageChange={handleActivityPageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No recent activity</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function FreelancerDashboardSkeleton() {
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
                <div className="h-48 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 