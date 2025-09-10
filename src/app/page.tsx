'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckSquare, Square, FileText, UserCheck, XCircle } from 'lucide-react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import FilterBar from '../components/FilterBar';
import TanStackInventoryTable from '../components/TanStackInventoryTable';
import ActionDropdown from '../components/ActionDropdown';
import Pagination from '../components/Pagination';
import LoadingSpinner, { TableLoadingState } from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { User, SubmissionRecord, FilterState, PaginationState, ActionDropdownItem } from '../types';
import { useApi, api } from '../hooks/useApi';
import { mockUser, mockSubmissions } from '../data/mockData';

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    searchAll: '',
    assignedTo: '',
    status: ''
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 15,
    totalRecords: mockSubmissions.length,
    totalPages: Math.ceil(mockSubmissions.length / 15)
  });

  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(mockSubmissions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { state: apiState, execute: fetchSubmissions } = useApi(api.getSubmissions);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // In a real app, this would fetch from API
        // For now, we'll simulate with mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setSubmissions(mockSubmissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter records based on current filters
  const filteredRecords = useMemo(() => {
    return submissions.filter((record: SubmissionRecord) => {
      const matchesSearch = !filters.searchAll || 
        record.id.toLowerCase().includes(filters.searchAll.toLowerCase()) ||
        record.dln.toLowerCase().includes(filters.searchAll.toLowerCase()) ||
        record.formType.toLowerCase().includes(filters.searchAll.toLowerCase()) ||
        record.taxPeriod.toLowerCase().includes(filters.searchAll.toLowerCase());

      const matchesAssignee = !filters.assignedTo || record.assignedTo === filters.assignedTo;
      const matchesStatus = !filters.status || record.status === filters.status;

      return matchesSearch && matchesAssignee && matchesStatus;
    });
  }, [filters, submissions]);

  // Paginate filtered records
  const paginatedRecords = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, pagination.currentPage, pagination.pageSize]);

  // Update pagination when filters change
  useMemo(() => {
    const totalPages = Math.ceil(filteredRecords.length / pagination.pageSize);
    setPagination(prev => ({
      ...prev,
      totalRecords: filteredRecords.length,
      totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1)
    }));
  }, [filteredRecords.length, pagination.pageSize]);

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    const totalPages = Math.ceil(filteredRecords.length / pageSize);
    setPagination(prev => ({
      ...prev,
      pageSize,
      totalPages,
      currentPage: 1
    }));
  };

  const actionItems: ActionDropdownItem[] = [
    {
      id: 'assign-examiner',
      label: 'Assign to Tax Examiner',
      icon: <UserCheck size={16} />,
      onClick: () => console.log('Assign to Tax Examiner', selectedRecords)
    },
    {
      id: 'assign-me',
      label: 'Assign to me',
      icon: <UserCheck size={16} />,
      onClick: () => console.log('Assign to me', selectedRecords)
    },
    {
      id: 'qr-review',
      label: 'Assign for QR Review',
      icon: <FileText size={16} />,
      onClick: () => console.log('Assign for QR Review', selectedRecords)
    },
    {
      id: 'suspend',
      label: 'Suspend',
      icon: <XCircle size={16} />,
      onClick: () => console.log('Suspend', selectedRecords)
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={mockUser} />
      
      <div className="lg:grid lg:grid-cols-[250px_1fr] gap-4 p-4">
        <Navigation 
          className="hidden lg:block" 
          onFilterChange={(filter) => {
            if (filter.type === 'status') {
              setFilters(prev => ({ ...prev, status: filter.value }));
            } else if (filter.type === 'assignee') {
              setFilters(prev => ({ ...prev, assignedTo: filter.value }));
            } else if (filter.type === 'view' && filter.value === 'all') {
              setFilters({ searchAll: '', assignedTo: '', status: '' });
            }
          }}
        />
        
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-200">
            <h2 className="text-xl font-semibold text-blue-900">Error Inventory</h2>
          </div>
          
          {error && (
            <ErrorAlert 
              type="error"
              title="Error Loading Data"
              message={error}
              onClose={() => setError(null)}
              className="mb-6"
            />
          )}
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <FilterBar filters={filters} onFilterChange={setFilters} />
            <ActionDropdown 
              items={actionItems}
              className={selectedRecords.length === 0 ? 'opacity-50 pointer-events-none' : ''}
            />
          </div>
          
          {loading ? (
            <TableLoadingState />
          ) : (
            <>
              <TanStackInventoryTable 
                records={paginatedRecords}
                selectedRecords={selectedRecords}
                onSelectionChange={setSelectedRecords}
              />
              
              <div className="pt-4">
                <Pagination 
                  pagination={pagination}
                  onPaginationChange={setPagination}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
