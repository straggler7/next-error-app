'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../types';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  disableDailySummary?: boolean;
  hideNav?: boolean;
}

export default function Header({ showBackButton = false, backHref = '/', disableDailySummary = false, hideNav = false }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      // Close the dropdown menu
      setIsUserMenuOpen(false);
      
      // Make API call to logout endpoint
      await fetch('/api/v1/era/users/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${user?.seid}`
        },
      });
      
      // Redirect to logout page regardless of API response
      router.push('/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect to logout page even if API call fails
      router.push('/logout');
    }
  };

  // Don't render if not authenticated or no user
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <div className="bg-color-irs-blue bg-gradient-to-r from-[#00599c] to-[#00599c] text-white px-4 sm:px-8 py-4 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            {showBackButton && (
              <Link 
                href={backHref}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-white/20 hover:border-white/30 hover:-translate-y-0.5 whitespace-nowrap"
              >
                <span className="hidden sm:inline">← Back</span>
                <span className="sm:hidden">← Back</span>
              </Link>
            )}
            <h1 className="text-lg sm:text-2xl font-semibold truncate">
              <span className="hidden sm:inline">IRS Error Resolution Application</span>
              <span className="sm:hidden">IRS ERS</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3 relative">
            <div className="bg-white/20 rounded-full p-2 flex items-center justify-center">
              <UserIcon size={20} />
            </div>
            <div className="flex flex-col items-end">
              <div className="text-sm font-semibold leading-tight">{user.name} ({user.role})</div>
              {/* <div className="text-xs opacity-80 leading-tight">{user.role} • {user.group}</div> */}
            </div>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <ChevronDown size={16} />
              </button>
              
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl min-w-40 z-20">
                    {/* <a 
                      href="#" 
                      className="block px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-blue-900 transition-colors"
                    >
                      Profile Settings
                    </a> */}
                    <button 
                      onClick={() => {
                        if (!disableDailySummary) {
                          setIsUserMenuOpen(false);
                          router.push('/daily-summary');
                        }
                      }}
                      disabled={disableDailySummary}
                      className={`block w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        disableDailySummary 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-gray-700 hover:bg-gray-50 hover:text-blue-900'
                      }`}
                    >
                      Daily Summary
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-blue-900 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Bar */}
      {!hideNav && (
      <nav className="bg-[#003d6b] text-white shadow-sm h-[40px]">
        <div className="px-2 h-full">
          <div className="flex items-center space-x-0 h-full">
            <Link 
              href="/home"
              className={`px-6 h-full flex items-center text-sm font-medium transition-colors duration-200 border-r border-white/20 hover:bg-white/10 ${
                pathname === '/home' || pathname === '/'
                  ? 'bg-[#00599c] text-white'
                  : ''
              }`}
            >
              Home
            </Link>
            <Link 
              href="/daily-summary"
              className={`px-6 h-full flex items-center text-sm font-medium transition-colors duration-200 border-r border-white/20 hover:bg-white/10 ${
                pathname.startsWith('/daily-summary')
                  ? 'bg-[#00599c] text-white'
                  : ''
              }`}
            >
              Daily Summary
            </Link>
            {/* Only show Reports and Manage Profiles for managers */}
            {(user.group === 'managers' || user.group === 'analysts') && (
              <Link 
                href="/reports"
                className={`px-6 h-full flex items-center text-sm font-medium transition-colors duration-200 border-r border-white/20 hover:bg-white/10 ${
                  pathname.startsWith('/reports')
                    ? 'bg-[#00599c] text-white'
                    : ''
                }`}
              >
                Reports
              </Link>
            )}
            {user.group === 'managers' && (
              <Link 
                href="/manage-profiles"
                className={`px-6 h-full flex items-center text-sm font-medium transition-colors duration-200 hover:bg-white/10 ${
                  pathname.startsWith('/manage-profiles')
                    ? 'bg-[#00599c] text-white'
                    : ''
                }`}
              >
                Manage Profiles
              </Link>
            )}
          </div>
        </div>
      </nav>
      )}
    </>
  );
}
