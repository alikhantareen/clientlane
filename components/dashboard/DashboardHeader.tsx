import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FolderOpen, 
  FileText, 
  HardDrive,
  Plus,
  Folder
} from "lucide-react";
import Link from "next/link";

interface FreelancerStats {
  totalPortals: number;
  totalClients: number;
  totalUpdates: number;
  storageUsed: string;
}

interface ClientStats {
  assignedPortals: number;
}

interface DashboardHeaderProps {
  type: 'freelancer' | 'client';
  stats: FreelancerStats | ClientStats;
  title: string;
  subtitle: string;
}

export function DashboardHeader({ type, stats, title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-slate-300 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {type === 'freelancer' ? (
            <Link href="/portal/create">
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Portal
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Folder className="h-4 w-4" />
              <span>{(stats as ClientStats).assignedPortals} Active Projects</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {type === 'freelancer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-300">Total Portals</p>
                  <p className="text-3xl font-bold text-white mt-2">{(stats as FreelancerStats).totalPortals}</p>
                  <p className="text-xs text-slate-400 mt-1">Portals created</p>
                </div>
                <div className="p-3 bg-blue-600/20 rounded-full">
                  <FolderOpen className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-300">Total Clients</p>
                  <p className="text-3xl font-bold text-white mt-2">{(stats as FreelancerStats).totalClients}</p>
                  <p className="text-xs text-slate-400 mt-1">Unique clients</p>
                </div>
                <div className="p-3 bg-emerald-600/20 rounded-full">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300">Total Updates</p>
                  <p className="text-3xl font-bold text-white mt-2">{(stats as FreelancerStats).totalUpdates}</p>
                  <p className="text-xs text-slate-400 mt-1">Updates posted</p>
                </div>
                <div className="p-3 bg-purple-600/20 rounded-full">
                  <FileText className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-300">Storage Used</p>
                  <p className="text-3xl font-bold text-white mt-2">{(stats as FreelancerStats).storageUsed}</p>
                  <p className="text-xs text-slate-400 mt-1">Files uploaded</p>
                </div>
                <div className="p-3 bg-orange-600/20 rounded-full">
                  <HardDrive className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 