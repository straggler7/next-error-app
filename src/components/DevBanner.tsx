'use client';

import { useAuth } from '../contexts/AuthContext';

export default function DevBanner() {
  const { isDevelopmentMode, seid } = useAuth();

  // Only show in development mode and when using dev SEID
  if (!isDevelopmentMode || (seid !== 'dev-user-123' && seid !== 'U1000')) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-center text-sm font-medium">
      🔓 Development Mode: Authentication Bypassed
    </div>
  );
}
