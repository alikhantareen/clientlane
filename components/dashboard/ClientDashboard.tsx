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
  Calendar,
  BarChart3,
  Folder
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { DashboardLayout } from "./DashboardLayout";

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'archived':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
    <DashboardLayout
      type="client"
      stats={{
        assignedPortals: data.assignedPortals.length
      }}
      title="Dashboard"
      subtitle="Access your project portals and stay updated on progress."
    >
      <div className="space-y-6">
        {/* First Row: My Project Portals and Recent Files */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Portals */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FolderOpen className="h-6 w-6" />
                My Project Portals
              </CardTitle>
              <p className="text-sm text-gray-600">
                Portals you have access to
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex flex-col">
                {data.assignedPortals.length > 0 ? (
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {data.assignedPortals.map((portal) => (
                      <div key={portal.id} className="flex items-center gap-6 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center border">
                            {portal.thumbnailUrl ? (
                              <img 
                                src={portal.thumbnailUrl} 
                                alt={portal.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <FolderOpen className="h-10 w-10 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{portal.name}</h4>
                            <Badge className={getStatusColor(portal.status)}>
                              {portal.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{portal.description}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={portal.freelancerImage} />
                              <AvatarFallback className="text-xs">{portal.freelancerName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">{portal.freelancerName}</span>
                          </div>
                          <div className="flex items-center gap-6 text-xs text-gray-500">
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
                          <Button className="gap-2 cursor-pointer">
                            <Eye className="h-4 w-4" />
                            Open Portal
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                      <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No portals assigned yet</h3>
                      <p className="text-sm text-gray-500">
                        You'll see your project portals here once they're shared with you.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Files */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Upload className="h-5 w-5" />
                Recent Files
              </CardTitle>
              <p className="text-sm text-gray-600">
                Files shared with you across all portals
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex flex-col">
                {sectionLoading.files ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : data.sharedFiles.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {data.sharedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {file.portalName} • {formatFileSize(file.fileSize)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <a href={file.fileUrl} download>
                            <Button variant="ghost" size="sm" className="gap-2 cursor-pointer">
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                    
                    {data.pagination?.files && (
                      <div className="pt-4 border-t mt-4">
                        <Pagination
                          currentPage={data.pagination.files.currentPage}
                          totalPages={data.pagination.files.totalPages}
                          totalItems={data.pagination.files.totalItems}
                          itemsPerPage={data.pagination.files.itemsPerPage}
                          onPageChange={handleFilesPageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No files shared yet</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row: Recent Updates and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Updates */}
          <Card className="border-2 border-gray-300 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Recent Updates
              </CardTitle>
              <p className="text-sm text-gray-600">
                Latest project updates from your portals
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex flex-col">
                {sectionLoading.updates ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : data.unreadUpdates.length > 0 ? (
                  <>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {data.unreadUpdates.map((update) => (
                        <div key={update.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-sm text-gray-900 flex-1">{update.title}</h4>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">
                            {update.portalName} • by {update.authorName}
                          </p>
                          <div 
                            className="text-sm text-gray-700 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: update.content }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {data.pagination?.updates && (
                      <div className="pt-4 border-t mt-4">
                        <Pagination
                          currentPage={data.pagination.updates.currentPage}
                          totalPages={data.pagination.updates.totalPages}
                          totalItems={data.pagination.updates.totalItems}
                          itemsPerPage={data.pagination.updates.itemsPerPage}
                          onPageChange={handleUpdatesPageChange}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">No recent updates</p>
                    </div>
                  </div>
                )}
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
                Latest activity across your portals
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex flex-col">
                {sectionLoading.activity ? (
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

function ClientDashboardSkeleton() {
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