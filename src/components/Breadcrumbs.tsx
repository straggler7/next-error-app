'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const router = useRouter();

  const handleClick = (href: string) => {
    router.push(href);
  };

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
            )}
            
            {item.isActive ? (
              <span className="text-gray-500 font-medium">
                {item.label}
              </span>
            ) : item.href ? (
              <button
                onClick={() => handleClick(item.href!)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200 flex items-center gap-1 cursor-pointer"
              >
                {/* {index === 0 && <Home className="w-4 h-4" />} */}
                {item.label}
              </button>
            ) : (
              <span className="text-gray-500">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Helper function to create common breadcrumb patterns
export const createBreadcrumbs = {
  home: (): BreadcrumbItem => ({ label: 'Home', href: '/home' }),
  
  workRecord: (fromHome = true): BreadcrumbItem[] => [
    ...(fromHome ? [createBreadcrumbs.home()] : []),
    { label: 'Work Record', isActive: true }
  ],
  
  qrInventory: (fromHome = true): BreadcrumbItem[] => [
    ...(fromHome ? [createBreadcrumbs.home()] : []),
    { label: 'QR Inventory', isActive: true }
  ],
  
  qrDetails: (fromHome = true, fromQrInventory = true): BreadcrumbItem[] => [
    ...(fromHome ? [createBreadcrumbs.home()] : []),
    ...(fromQrInventory ? [{ label: 'QR Inventory', href: '/qrInventory' }] : []),
    { label: 'QR Details', isActive: true }
  ],
  
  dailySummary: (fromHome = true): BreadcrumbItem[] => [
    ...(fromHome ? [createBreadcrumbs.home()] : []),
    { label: 'Daily Summary', isActive: true }
  ]
};
