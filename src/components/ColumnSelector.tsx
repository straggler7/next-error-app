'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  width?: number;
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export default function ColumnSelector({ columns, onColumnsChange }: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (key: string) => {
    const updatedColumns = columns.map(col => 
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onColumnsChange(updatedColumns);
  };

  const visibleCount = columns.filter(col => col.visible).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Settings size={16} className="mr-2" />
        Columns ({visibleCount})
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Select Columns</h3>
              <p className="text-xs text-gray-500 mt-1">Choose which columns to display</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {columns.map((column) => (
                <div key={column.key} className="px-3 py-2 hover:bg-gray-50">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={column.visible}
                      onChange={() => toggleColumn(column.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                    />
                    <div className="flex items-center flex-1">
                      {column.visible ? (
                        <Eye size={14} className="text-blue-600 mr-2" />
                      ) : (
                        <EyeOff size={14} className="text-gray-400 mr-2" />
                      )}
                      <span className={`text-sm ${column.visible ? 'text-gray-900' : 'text-gray-500'}`}>
                        {column.label}
                      </span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    const allVisible = columns.map(col => ({ ...col, visible: true }));
                    onColumnsChange(allVisible);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Show All
                </button>
                <button
                  onClick={() => {
                    const allHidden = columns.map(col => ({ ...col, visible: false }));
                    onColumnsChange(allHidden);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Hide All
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
