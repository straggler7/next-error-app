'use client';

import { Search } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const assignees = [
    'All Assignees',
    'Unassigned',
    'Thompson, Sarah',
    'Garcia, Maria',
    'Davis, Robert',
    'Wilson, Jennifer',
    'Brown, Michael'
  ];

  const statuses = [
    'All Status',
    'New',
    'Assigned',
    'QR Review',
    'Suspended'
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <button className="px-4 sm:px-6 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5">
          Refresh
        </button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search ID, DLN, Form Type..."
            value={filters.searchAll}
            onChange={(e) => onFilterChange({ ...filters, searchAll: e.target.value })}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm w-full sm:min-w-64 lg:min-w-80 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          />
        </div>
        
        <div className="flex gap-3 sm:gap-4">
          <select
            value={filters.assignedTo}
            onChange={(e) => onFilterChange({ ...filters, assignedTo: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm flex-1 sm:min-w-36 cursor-pointer transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          >
            {assignees.map((assignee) => (
              <option key={assignee} value={assignee === 'All Assignees' ? '' : assignee}>
                {assignee}
              </option>
            ))}
          </select>
          
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm flex-1 sm:min-w-36 cursor-pointer transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          >
            {statuses.map((status) => (
              <option key={status} value={status === 'All Status' ? '' : status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
