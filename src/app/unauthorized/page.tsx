'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-color-irs-blue bg-gradient-to-r from-[#00599c] to-[#00599c] text-white px-4 sm:px-8 py-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-semibold truncate">
              <span className="hidden sm:inline">IRS Error Resolution Application</span>
              <span className="sm:hidden">IRS ERS</span>
            </h1>
          </div>
        </div>
      </div>

      <nav className="bg-[#003d6b] text-white shadow-sm h-[50px]">
        <div className="px-2 h-full">
          <div className="flex items-center space-x-0 h-full">
            <Link 
              href="/home"
              className="px-6 h-full flex items-center text-sm font-medium hover:bg-white/10 transition-colors duration-200 border-r border-white/20"
            >
              Home
            </Link>
            <Link 
              href="/daily-summary"
              className="px-6 h-full flex items-center text-sm font-medium hover:bg-white/10 transition-colors duration-200 border-r border-white/20"
            >
              Daily Summary
            </Link>
            <Link 
              href="/reports"
              className="px-6 h-full flex items-center text-sm font-medium hover:bg-white/10 transition-colors duration-200 border-r border-white/20"
            >
              Reports
            </Link>
            <Link 
              href="/manage-profiles"
              className="px-6 h-full flex items-center text-sm font-medium hover:bg-white/10 transition-colors duration-200"
            >
              Manage Profiles
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h1>
            <p className="text-gray-600 leading-relaxed">
              You need to be authenticated through the IRS SSO system to access this application. 
              Please ensure you are logged in to the IRS portal.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            {/* <Link
              href="/"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Home
            </Link> */}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you continue to experience issues, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
