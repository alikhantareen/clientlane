import { ReactNode } from "react";
import TopNavigation from "@/components/TopNavigation";
import { DashboardHeader } from "./DashboardHeader";

interface FreelancerStats {
  totalPortals: number;
  totalClients: number;
  totalUpdates: number;
  storageUsed: string;
}

interface ClientStats {
  assignedPortals: number;
}

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'freelancer' | 'client';
  stats: FreelancerStats | ClientStats;
  title: string;
  subtitle: string;
}

export function DashboardLayout({ children, type, stats, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation>
        <DashboardHeader 
          type={type}
          stats={stats}
          title={title}
          subtitle={subtitle}
        />
      </TopNavigation>
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 