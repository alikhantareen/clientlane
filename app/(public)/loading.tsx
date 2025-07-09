import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PublicLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
} 