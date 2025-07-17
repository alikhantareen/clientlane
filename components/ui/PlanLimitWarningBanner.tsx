"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PlanLimitWarningBannerProps {
  className?: string;
}

export function PlanLimitWarningBanner({ className = "" }: PlanLimitWarningBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [warningData, setWarningData] = useState<{
    message: string;
    overLimitTypes: string[];
  } | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const checkLimits = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Only check limits for freelancers
      if ((session.user as any).role !== 'freelancer') {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/plan-limits/check-over-limits');
        const data = await response.json();

        if (data.isOverLimit) {
          setWarningData({
            message: data.message,
            overLimitTypes: data.overLimitTypes
          });
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking plan limits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLimits();
  }, [session]);

  const handleUpgrade = () => {
    router.push('/subscriptions');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to avoid showing it again this session
    localStorage.setItem('planLimitWarningDismissed', 'true');
  };

  // Check if user has already dismissed the warning this session
  useEffect(() => {
    const dismissed = localStorage.getItem('planLimitWarningDismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  if (isLoading || !isVisible || !warningData) {
    return null;
  }

  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Plan Limit Exceeded
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {warningData.message}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleUpgrade}
                className="bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1 cursor-pointer"
              >
                Upgrade Plan
              </Button>
              <button
                onClick={handleDismiss}
                className="text-red-400 hover:text-red-600 p-1"
                aria-label="Dismiss warning"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanLimitWarningBanner; 