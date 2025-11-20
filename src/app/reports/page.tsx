'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to the first report (1340)
    router.replace('/reports/1340');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="center-panel bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Report 1340...</p>
        </div>
      </div>
    </div>
  );
}
