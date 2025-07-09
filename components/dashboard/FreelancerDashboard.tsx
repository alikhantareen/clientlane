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
  ArrowUpRight
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your client portal activity.
        </p>
      </div>

      <hr className="my-4" />

      <PlanLimitWarningBanner />

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portals</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalPortals}</div>
            <p className="text-xs text-muted-foreground">
              Portals created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Unique clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUpdates}</div>
            <p className="text-xs text-muted-foreground">
              Updates posted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.storageUsed}</div>
            <p className="text-xs text-muted-foreground">
              Files uploaded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Activity Chart */}
      <ActivityChart
        data={data.monthlyActivity}
        title="Monthly Activity"
        description="Track your updates and new clients over the last 12 months"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Portals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Active Portals
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your most active portals by update count
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPortals.length > 0 ? (
                data.topPortals.map((portal) => (
                  <div key={portal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{portal.name}</h4>
                        <Badge className={getStatusColor(portal.status)}>
                          {portal.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{portal.clientName}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
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
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No portals created yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Plan Usage
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your current subscription plan
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{data.planUsage.currentPlan} Plan</h4>
                  <p className="text-sm text-muted-foreground">
                    {data.planUsage.isActive ? 'Active subscription' : 'No active subscription'}
                  </p>
                  {data.planUsage.endsAt && (
                    <p className="text-xs text-muted-foreground mt-1">
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
                      <Button size="sm" className="cursor-pointer">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>You have created {data.overview.totalPortals} portals and {data.overview.totalClients} clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Latest actions across your portals
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : data.recentActivity.length > 0 ? (
              <>
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{activity.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>{' '}
                        {activity.message} in{' '}
                        <span className="font-medium">{activity.portalName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {data.pagination?.activity && (
                  <Pagination
                    currentPage={data.pagination.activity.currentPage}
                    totalPages={data.pagination.activity.totalPages}
                    totalItems={data.pagination.activity.totalItems}
                    itemsPerPage={data.pagination.activity.itemsPerPage}
                    onPageChange={handleActivityPageChange}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FreelancerDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 