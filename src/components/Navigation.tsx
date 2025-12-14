'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface NavigationProps {
  className?: string;
  onFilterChange?: (filter: { type: string; value: string }) => void;
}

export default function Navigation({ className = '', onFilterChange }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  // const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('all');

  const handleFilterClick = (filter: { type: string; value: string }, href: string, itemId: string) => {
    setActiveFilter(itemId);
    
    // If it's a navigation type, always navigate to the URL
    if (filter.type === 'navigate') {
      router.push(href);
    } else if (onFilterChange) {
      // If onFilterChange is provided, use it (for parent component state management)
      onFilterChange(filter);
    } else {
      // Otherwise, navigate to the URL
      router.push(href);
    }
  };

  const navSections = [
    {
      title: 'Reports',
      items: [
        { 
          id: 'report1340', 
          label: '1340', 
          href: '/reports/1340', 
          filter: { type: 'navigate', value: 'report1340' }
        },
        { 
          id: 'report1341', 
          label: '1341', 
          href: '/reports/1341', 
          filter: { type: 'navigate', value: 'report1341' }
        },
        { 
          id: 'report1342', 
          label: '1342', 
          href: '/reports/1342', 
          filter: { type: 'navigate', value: 'report1342' }
        },
        { 
          id: 'report0540', 
          label: '0540', 
          href: '/reports/0540', 
          filter: { type: 'navigate', value: 'report0540' }
        },
        { 
          id: 'report7740', 
          label: '7740', 
          href: '/reports/7740', 
          filter: { type: 'navigate', value: 'report7740' }
        },
        { 
          id: 'report7741', 
          label: '7741', 
          href: '/reports/7741', 
          filter: { type: 'navigate', value: 'report7741' }
        },
        { 
          id: 'report7746', 
          label: '7746', 
          href: '/reports/7746', 
          filter: { type: 'navigate', value: 'report7746' }
        },
        { 
          id: 'report7747', 
          label: '7747', 
          href: '/reports/7747', 
          filter: { type: 'navigate', value: 'report7747' }
        },
        { 
          id: 'report0340', 
          label: '0340', 
          href: '/reports/0340', 
          filter: { type: 'navigate', value: 'report0340' }
        },
        { 
          id: 'report0341', 
          label: '0341', 
          href: '/reports/0341', 
          filter: { type: 'navigate', value: 'report0341' }
        },
        { 
          id: 'reportMERDAIL', 
          label: 'MERDAIL', 
          href: '/reports/MERDAIL', 
          filter: { type: 'navigate', value: 'reportMERDAIL' }
        },
        { 
          id: 'reportMERYRDT', 
          label: 'MERYRDT', 
          href: '/reports/MERYRDT', 
          filter: { type: 'navigate', value: 'reportMERYRDT' }
        },
      ]
    }
  ];

  const isActive = (itemId: string) => {
    if (pathname === '/reports/1340' && itemId === 'report1340') return true;
    if (pathname === '/reports/1341' && itemId === 'report1341') return true;
    if (pathname === '/reports/1342' && itemId === 'report1342') return true;
    if (pathname === '/reports/7740' && itemId === 'report7740') return true;
    if (pathname === '/reports/7741' && itemId === 'report7741') return true;
    if (pathname === '/reports/7746' && itemId === 'report7746') return true;
    if (pathname === '/reports/7747' && itemId === 'report7747') return true;
    return activeFilter === itemId;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 h-full overflow-y-auto border border-gray-200 ${className}`}>
      {navSections.map((section) => (
        <div key={section.title} className="mb-8 last:mb-0">
          <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4 px-4">
            {section.title}
          </div>
          <nav>
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleFilterClick(item.filter, item.href, item.id)}
                className={`
                  block w-full text-left px-4 py-3 text-sm font-medium rounded-md mb-2 transition-all duration-200
                  ${isActive(item.id)
                    ? 'bg-blue-50 text-blue-900 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-900'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}
