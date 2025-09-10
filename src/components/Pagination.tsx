'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationState } from '../types';

interface PaginationProps {
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
}

export default function Pagination({ 
  pagination, 
  onPaginationChange 
}: PaginationProps) {
  const { currentPage, pageSize, totalRecords, totalPages } = pagination;
  
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex justify-between items-center px-8 py-6 bg-white border-t border-gray-200 rounded-b-xl -mt-px">
      <div className="text-gray-600 text-sm font-medium">
        Showing {startRecord}-{endRecord} of {totalRecords} records
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPaginationChange({ ...pagination, currentPage: currentPage - 1 })}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-10 h-10"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>
        
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-400 font-medium">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPaginationChange({ ...pagination, currentPage: Number(page) })}
                className={`
                  inline-flex items-center justify-center min-w-10 h-10 px-2 text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5
                  ${currentPage === page
                    ? 'bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }
                `}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        <button
          onClick={() => onPaginationChange({ ...pagination, currentPage: currentPage + 1 })}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-10 h-10"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
        <label htmlFor="pageSize">Show:</label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) => onPaginationChange({ ...pagination, pageSize: parseInt(e.target.value), currentPage: 1 })}
          className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-700 text-sm cursor-pointer transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>per page</span>
      </div>
    </div>
  );
}
