'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import { ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  disableDailySummary?: boolean;
}

export default function Header({ showBackButton = false, backHref = '/', disableDailySummary = false }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Don't render if not authenticated or no user
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
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
            <div className="text-sm font-semibold leading-tight">{user.name}</div>
            <div className="text-xs opacity-80 leading-tight">{user.role} • {user.group}</div>
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
                  <a 
                    href="#" 
                    className="block px-4 py-3 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:text-blue-900 transition-colors"
                  >
                    Logout
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
