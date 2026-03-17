"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationState } from "../types";

interface PaginationProps {
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
}

export default function Pagination({
  pagination,
  onPaginationChange,
}: PaginationProps) {
  const { currentPage, pageSize, totalRecords, totalPages } = pagination;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = startRecord + totalRecords - 1;

  const getVisiblePages = (): Array<number | "..."> => {
    const pages: Array<number | "..."> = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i += 1) {
        pages.push(i);
      }
      return pages;
    }

    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
      return pages;
    }

    if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      return pages;
    }

    pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    return pages;
  };

  return (
    <div className="-mt-px flex items-center justify-between rounded-b-xl border-t border-gray-200 bg-white px-8 py-6">
      <div className="text-sm font-medium text-gray-600">
        Showing {startRecord}-{endRecord} (Page {currentPage})
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPaginationChange({ ...pagination, currentPage: currentPage - 1 })}
          disabled={currentPage === 1}
          className="inline-flex h-10 min-w-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 py-2 font-medium text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPaginationChange({ ...pagination, currentPage: Number(page) })}
                className={`
                  inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5
                  ${
                    currentPage === page
                      ? "border border-blue-600 bg-blue-600 text-white hover:border-blue-700 hover:bg-blue-700"
                      : "border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }
                `}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => onPaginationChange({ ...pagination, currentPage: currentPage + 1 })}
          disabled={currentPage === totalPages}
          className="inline-flex h-10 min-w-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
        <label htmlFor="pageSize">Show:</label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={(e) =>
            onPaginationChange({
              ...pagination,
              pageSize: parseInt(e.target.value, 10),
              currentPage: 1,
            })
          }
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-all duration-200 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 focus:outline-none"
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
