'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ActionDropdownItem } from '../types';

interface ActionDropdownProps {
  items: ActionDropdownItem[];
  buttonText?: string;
  className?: string;
}

export default function ActionDropdown({ 
  items, 
  buttonText = 'Actions',
  className = '' 
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg border border-blue-600 transition-all duration-200 hover:bg-blue-700 hover:border-blue-700 hover:-translate-y-0.5 min-w-32 shadow-sm"
      >
        {buttonText}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl min-w-48 z-20 opacity-100 visible transform translate-y-0 transition-all duration-200">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`
                  flex items-center gap-3 w-full px-4 py-3 text-gray-700 text-sm font-medium text-left transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === items.length - 1 ? 'rounded-b-lg' : ''}
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
