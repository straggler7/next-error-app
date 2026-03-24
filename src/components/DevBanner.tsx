'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { User } from '../types';
import mockUsers from '../data/mockUsers.json';

// const mockUsers: string[] = [
//   '1pzwb',
//   'f3wpb'
// ];

export default function DevBanner() {
  const { isDevelopmentMode, user, refreshAuth } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [customSeid, setCustomSeid] = useState('');

  // Only show in development mode
  if (!isDevelopmentMode) {
    return null;
  }

  const devRole = process.env.NEXT_PUBLIC_DEV_ROLE;
  const availableRoles = ['managers', 'tax_examiners'];

  const handleRoleChange = (newRole: string) => {
    console.log('🔄 DevBanner: Role change requested to:', newRole);
    // This would require a page reload to change the environment variable effect
    // For now, we'll just show a message
    alert(`To change role to ${newRole}, set NEXT_PUBLIC_DEV_ROLE=${newRole} in your .env.local file and restart the dev server.`);
    setIsRoleDropdownOpen(false);
  };

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
    setCustomSeid(''); // Clear custom input after selection
  };

  const handleCustomSeidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customSeid.trim()) {
      await handleUserSelect(customSeid.trim());
    }
  };

  return (
    <div className="bg-yellow-500 text-black px-4 py-2 text-sm font-medium">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span>🔓 Development Mode: Authentication Bypassed</span>
          {user && (
            <>
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                SEID: {user.seid}
              </span>
              <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                Role: {user.group || 'Unknown'}
              </span>
              {devRole && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  DEV_ROLE: {devRole}
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Role Selector */}
          {devRole && (
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
              >
                Change Role ▼
              </button>
              
              {isRoleDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-48">
                  <div className="py-1">
                    {availableRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                          devRole === role ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{role}</div>
                        <div className="text-xs text-gray-500">
                          {role === 'managers' ? 'Full access to all features' : 'Limited access'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* User Selector */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-3 py-1 rounded text-xs font-medium transition-colors"
            >
              Switch User ▼
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-96">
                {/* Custom SEID Input */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <form onSubmit={handleCustomSeidSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={customSeid}
                      onChange={(e) => setCustomSeid(e.target.value)}
                      placeholder="Enter custom SEID..."
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!customSeid.trim()}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                  <p className="text-xs text-gray-600 mt-1">Enter any SEID to test with</p>
                </div>

                {/* Mock Users List */}
                <div className="py-1 max-h-64 overflow-y-auto">
                  {mockUsers.map((mockUser) => (
                    <button
                      key={mockUser.seid}
                      onClick={async () => {
                        await handleUserSelect(mockUser.seid);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        user?.seid === mockUser.seid ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="font-medium">
                        {mockUser.name} ({mockUser.seid})
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
