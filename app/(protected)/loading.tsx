import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ProtectedLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
} 