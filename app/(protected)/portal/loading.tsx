import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PortalLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 h-screen">
      <LoadingSpinner size="md" text="Loading..." />
    </div>
  );
} 