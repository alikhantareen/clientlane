"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FolderOpen, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  User,
  Activity,
  Upload,
  Calendar
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ClientDashboardData {
  assignedPortals: {
    id: string;
    name: string;
    description: string;
    status: string;
    thumbnailUrl: string;
    freelancerName: string;
    freelancerEmail: string;
    freelancerImage?: string;
    updateCount: number;
    fileCount: number;
    lastUpdated: string;
    createdAt: string;
  }[];
  sharedFiles: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    portalName: string;
    uploaderName: string;
    uploaderEmail: string;
  }[];
  unreadUpdates: {
    id: string;
    title: string;
    content: string;
    portalName: string;
    authorName: string;
    authorEmail: string;
    createdAt: string;
  }[];
  recentActivity: {
    id: string;
    type: string;
    message: string;
    portalName: string;
    userName: string;
    createdAt: string;
  }[];
  pagination?: {
    files: {
      currentPage: number;
      totalItems: number;
      totalPages: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    updates: {
      currentPage: number;
      totalItems: number;
      totalPages: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
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

export function ClientDashboard() {
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filesPage, setFilesPage] = useState(1);
  const [updatesPage, setUpdatesPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [sectionLoading, setSectionLoading] = useState({
    files: false,
    updates: false,
    activity: false
  });

  const fetchData = async (options: {
    filesPage?: number;
    updatesPage?: number;
    activityPage?: number;
  } = {}) => {
    try {
      setSectionLoading(prev => ({
        ...prev,
        files: options.filesPage !== undefined,
        updates: options.updatesPage !== undefined,
        activity: options.activityPage !== undefined
      }));
      
      const params = new URLSearchParams({
        filesPage: (options.filesPage || filesPage).toString(),
        updatesPage: (options.updatesPage || updatesPage).toString(),
        activityPage: (options.activityPage || activityPage).toString()
      });
      
      const response = await fetch(`/api/dashboard/client?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setSectionLoading({
        files: false,
        updates: false,
        activity: false
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [filesPage, updatesPage, activityPage]);

  const handleFilesPageChange = (page: number) => {
    setFilesPage(page);
  };

  const handleUpdatesPageChange = (page: number) => {
    setUpdatesPage(page);
  };

  const handleActivityPageChange = (page: number) => {
    setActivityPage(page);
  };

  if (loading) {
    return <ClientDashboardSkeleton />;
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Access your project portals and stay updated on progress.
        </p>
      </div>

      <hr className="my-4" />

      {/* Assigned Portals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            My Project Portals
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Portals you have access to
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.assignedPortals.length > 0 ? (
              data.assignedPortals.map((portal) => (
                <div key={portal.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {portal.thumbnailUrl ? (
                        <img 
                          src={portal.thumbnailUrl} 
                          alt={portal.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <FolderOpen className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{portal.name}</h4>
                      <Badge className={getStatusColor(portal.status)}>
                        {portal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{portal.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={portal.freelancerImage} />
                        <AvatarFallback>{portal.freelancerName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{portal.freelancerName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {portal.updateCount} updates
                      </span>
                      <span className="flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        {portal.fileCount} files
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
                      Open Portal
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No portals assigned to you yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shared Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Recent Files
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Files shared with you across all portals
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sectionLoading.files ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : data.sharedFiles.length > 0 ? (
                <>
                  {data.sharedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.portalName} • {formatFileSize(file.fileSize)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <a href={file.fileUrl} download>
                        <Button variant="ghost" size="sm" className="cursor-pointer">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                  
                  {data.pagination?.files && (
                    <Pagination
                      currentPage={data.pagination.files.currentPage}
                      totalPages={data.pagination.files.totalPages}
                      totalItems={data.pagination.files.totalItems}
                      itemsPerPage={data.pagination.files.itemsPerPage}
                      onPageChange={handleFilesPageChange}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No files shared yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Updates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest project updates from your portals
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sectionLoading.updates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : data.unreadUpdates.length > 0 ? (
                <>
                  {data.unreadUpdates.map((update) => (
                    <div key={update.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{update.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {update.portalName} • by {update.authorName}
                      </p>
                      <div 
                        className="text-sm text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: update.content }}
                      />
                    </div>
                  ))}
                  
                  {data.pagination?.updates && (
                    <Pagination
                      currentPage={data.pagination.updates.currentPage}
                      totalPages={data.pagination.updates.totalPages}
                      totalItems={data.pagination.updates.totalItems}
                      itemsPerPage={data.pagination.updates.itemsPerPage}
                      onPageChange={handleUpdatesPageChange}
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No recent updates</p>
              )}
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
            Latest activity across your portals
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sectionLoading.activity ? (
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

function ClientDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 