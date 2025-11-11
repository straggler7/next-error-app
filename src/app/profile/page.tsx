'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useUserGroup } from '../../hooks/useSeid';
import Header from '../../components/Header';
import Breadcrumbs, { createBreadcrumbs } from '../../components/Breadcrumbs';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const userGroup = useUserGroup();

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect to forbidden if user is not a manager
    if (!user || userGroup !== 'managers') {
      router.replace('/forbidden');
      return;
    }
  }, [user, userGroup, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if user is not authorized (will redirect)
  if (!user || userGroup !== 'managers') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="px-4 pt-4 pb-2">
        <Breadcrumbs items={[
          createBreadcrumbs.home(),
          { label: 'Profile Settings', isActive: true }
        ]} />
      </div>
      
      <div className="main-container p-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manager-only configuration and settings</p>
          </div>
          
          <div className="space-y-6">
            {/* User Info Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Current User</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Name:</span> {user.name}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Role:</span> {user.role}
                </div>
                <div>
                  <span className="font-medium text-blue-800">Group:</span> {user.group}
                </div>
                <div>
                  <span className="font-medium text-blue-800">SEID:</span> {user.seid}
                </div>
              </div>
            </div>

            {/* Manager Settings Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6" style={{ display: 'none' }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Manager Settings</h2>
              <p className="text-gray-600 mb-4">This section is only accessible to users in the managers group.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white border rounded">
                  <span className="font-medium">System Configuration</span>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Configure
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white border rounded">
                  <span className="font-medium">User Management</span>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    Manage
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white border rounded">
                  <span className="font-medium">Reports & Analytics</span>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
