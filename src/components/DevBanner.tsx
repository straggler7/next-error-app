'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { User } from '../types';

const mockUsers: string[] = [
  'u1000',
  'f3wpb'
];

export default function DevBanner() {
  const { isDevelopmentMode, user, refreshAuth } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Only show in development mode
  if (!isDevelopmentMode) {
    return null;
  }

  const handleUserSelect = async (selectedSeid: string) => {
    console.log('🔄 DevBanner: User selected:', selectedSeid);
    
    // Store selected SEID in localStorage to persist across page reloads
    localStorage.setItem('dev-selected-seid', selectedSeid);
    console.log('🔄 DevBanner: Stored SEID in localStorage');
    
    // Refresh auth context without page reload
    if (refreshAuth) {
      console.log('🔄 DevBanner: Calling refreshAuth');
      await refreshAuth();
      console.log('🔄 DevBanner: refreshAuth completed');
    } else {
      console.log('🔄 DevBanner: refreshAuth not available, reloading page');
      // Fallback to page reload if refreshAuth is not available
      window.location.reload();
    }
    
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-sm font-medium">
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span>🔓 Development Mode: Authentication Bypassed</span>
          {user && (
            <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
              SEID: {user.seid}
            </span>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Switch User ▼
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-64">
              <div className="py-1">
                {mockUsers.map((seid) => (
                  <button
                    key={seid}
                    onClick={async () => {
                      await handleUserSelect(seid);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      user?.seid === seid ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="text-xs text-gray-500">
                      {seid}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
