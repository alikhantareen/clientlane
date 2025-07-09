"use client";

import { useSession } from "next-auth/react";
import { FreelancerDashboard } from "@/components/dashboard/FreelancerDashboard";
import { ClientDashboard } from "@/components/dashboard/ClientDashboard";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Access Denied</h3>
          <p className="text-sm text-gray-600">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role;

  // Render role-specific dashboard
  if (userRole === "freelancer") {
    return <FreelancerDashboard />;
  } else if (userRole === "client") {
    return <ClientDashboard />;
  } else {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-600">Invalid Role</h3>
          <p className="text-sm text-gray-600">
            Unable to determine your role. Please contact support.
          </p>
        </div>
      </div>
    );
  }
} 