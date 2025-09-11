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
      title: 'Submissions',
      items: [
        { 
          id: 'all', 
          label: 'All Records', 
          href: '/', 
          filter: { type: 'view', value: 'all' }
        },
        { 
          id: 'my', 
          label: 'My Records', 
          href: '/?filter=my', 
          filter: { type: 'assignee', value: 'Thompson, Sarah' }
        }
      ]
    },
    {
      title: 'Forms',
      items: [
        { 
          id: 'form4868', 
          label: 'Form 4868 Processing', 
          href: '/form4868', 
          filter: { type: 'navigate', value: 'form4868' }
        }
      ]
    },
    {
      title: 'Quick Filters',
      items: [
        { 
          id: 'new', 
          label: 'New', 
          href: '/?status=new', 
          filter: { type: 'status', value: 'New' }
        },
        { 
          id: 'assigned', 
          label: 'Assigned', 
          href: '/?status=assigned', 
          filter: { type: 'status', value: 'Assigned' }
        },
        { 
          id: 'qr_review', 
          label: 'QR Review', 
          href: '/?status=qr_review', 
          filter: { type: 'status', value: 'QR Review' }
        },
        { 
          id: 'suspended', 
          label: 'Suspended', 
          href: '/?status=suspended', 
          filter: { type: 'status', value: 'Suspended' }
        }
      ]
    }
  ];

  const isActive = (itemId: string) => {
    if (pathname === '/' && itemId === 'all') return true;
    if (pathname === '/form4868' && itemId === 'form4868') return true;
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
