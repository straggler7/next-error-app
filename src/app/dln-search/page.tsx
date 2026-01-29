'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckSquare, Square, FileText, UserCheck, XCircle, ArrowLeft } from 'lucide-react';
import Header from '../../components/Header';
import Breadcrumbs, { createBreadcrumbs } from '../../components/Breadcrumbs';
import FilterBar from '../../components/FilterBar';
import TanStackInventoryTable from '../../components/TanStackInventoryTable';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import ActionDropdown from '../../components/ActionDropdown';
import Pagination from '../../components/Pagination';
import LoadingSpinner, { TableLoadingState } from '../../components/LoadingSpinner';
import ErrorAlert from '../../components/ErrorAlert';
import { User, FilterState, PaginationState, ActionDropdownItem } from '../../types';
import { DLNSearchService, DLNSearchRecord, DLNSearchFilters } from '../../services/dlnSearchService';
import { useSeid } from '../../hooks/useSeid';
import { getServiceCenterName } from '../../utils/serviceCenters';

function DLNSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dlnQuery = searchParams.get('dln');
  const tinQuery = searchParams.get('tin');
  const nameControlQuery = searchParams.get('nameControl');
  const programQuery = searchParams.get('program');
  const currentUserSeid = useSeid();

  // DLN search specific filters - matching home page form
  const [searchFilters, setSearchFilters] = useState<DLNSearchFilters>({
    dln: dlnQuery ?? '',
    tin: tinQuery ?? '',
    nameControl: nameControlQuery ?? ''
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 15,
    totalRecords: 0,
    totalPages: 0
  });

  const [records, setRecords] = useState<DLNSearchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasInitiallyLoaded = useRef(false);
  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});

  // Load DLN search records
  const loadDLNSearchRecords = useCallback(async () => {
    // Prevent duplicate calls if already loading
    if (loading) {
      console.log('DLN Search: Already loading, skipping duplicate call');
      return;
    }

    // Check if any search criteria is provided
    const hasSearchCriteria = searchFilters.dln || searchFilters.tin || searchFilters.nameControl;
    if (!hasSearchCriteria) {
      setError('Please provide at least one search criteria (DLN, TIN, or Name Control)');
      return;
    }

    try {
      console.log('DLN Search: Starting loadDLNSearchRecords for DLN:', dlnQuery);
      setLoading(true);
      setError(null);

      // Get program code from URL parameter first, then fallback to session storage
      let programCode = programQuery || undefined;
      
      if (!programCode && typeof window !== 'undefined') {
        const selectionData = sessionStorage.getItem('selectionData');
        console.log('DLN Search - Raw selectionData from sessionStorage:', selectionData);
        const parsedSelectionData = selectionData ? JSON.parse(selectionData) : {};
        console.log('DLN Search - Parsed selectionData:', parsedSelectionData);
        programCode = parsedSelectionData.program;
      }

      // Use the DLN search service with current filter state
      const currentSearchFilters: DLNSearchFilters = {
        dln: searchFilters.dln,
        tin: searchFilters.tin,
        nameControl: searchFilters.nameControl,
        // programCode: programCode,
      };

      const response = await DLNSearchService.searchByDLN(
        currentSearchFilters,
        pagination.currentPage,
        pagination.pageSize,
        currentUserSeid || undefined
      );

      if (response) {
        const records = response.records || response;
        console.log('DLN Search API Response:', { 
          totalCount: response.totalCount, 
          recordsLength: records.length, 
          currentPage: pagination.currentPage,
          pageSize: pagination.pageSize 
        });
        
        setRecords(records);
        setPagination(prev => {
          // Always determine pagination based on received records
          const receivedRecords = records.length;
          const hasMorePages = receivedRecords === pagination.pageSize;
          
          return {
            ...prev,
            totalRecords: receivedRecords,
            totalPages: hasMorePages ? Math.max(prev.currentPage + 1, prev.totalPages) : prev.currentPage
          };
        });
      } else {
        setRecords([]);
        setPagination(prev => ({
          ...prev,
          totalRecords: 0,
          totalPages: 0
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load DLN search records');
      console.error('DLN Search: Error loading DLN search records:', err);
    } finally {
      setLoading(false);
    }
  }, [searchFilters.dln, searchFilters.tin, searchFilters.nameControl, currentUserSeid, pagination.currentPage, pagination.pageSize]);

  // Load data on component mount and when pagination changes
  useEffect(() => {
    console.log('DLN Search useEffect triggered, hasInitiallyLoaded:', hasInitiallyLoaded.current);
    
    // On first mount, always load
    if (!hasInitiallyLoaded.current) {
      hasInitiallyLoaded.current = true;
      loadDLNSearchRecords();
    } else if (records.length > 0) {
      // On subsequent pagination changes, only load if we have existing records
      console.log('DLN Search pagination change, reloading...');
      loadDLNSearchRecords();
    }
  }, [pagination.currentPage, pagination.pageSize]);

  // Filter the records based on 
  const filteredRecords = useMemo(() => {
    return records; // No client-side filtering needed since API handles filtering
  }, [records]);

  // Handle search form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setPagination(prev => ({ ...prev, currentPage: 1 }));

      // Get program code from URL parameter first, then fallback to session storage
      let programCode = programQuery || undefined;
      
      if (!programCode && typeof window !== 'undefined') {
        const selectionData = sessionStorage.getItem('selectionData');
        const parsedSelectionData = selectionData ? JSON.parse(selectionData) : {};
        programCode = parsedSelectionData.program;
      }

      // Include program code in search filters like in loadDLNSearchRecords
      const currentSearchFilters: DLNSearchFilters = {
        dln: searchFilters.dln,
        tin: searchFilters.tin,
        nameControl: searchFilters.nameControl,
        // programCode: programCode,
      };

      const response = await DLNSearchService.searchByDLN(
        currentSearchFilters,
        1, // Reset to first page
        pagination.pageSize,
        currentUserSeid || undefined
      );

      if (response) {
        const records = response.records || response;
        console.log('DLN Search Submit API Response:', { 
          totalCount: response.totalCount, 
          recordsLength: records.length, 
          pageSize: pagination.pageSize 
        });
        
        setRecords(records);
        setPagination(prev => {
          // Always determine pagination based on received records
          const receivedRecords = records.length;
          const hasMorePages = receivedRecords === pagination.pageSize;
          
          return {
            ...prev,
            currentPage: 1,
            totalRecords: receivedRecords,
            totalPages: hasMorePages ? Math.max(2, prev.totalPages) : 1
          };
        });
        // Mark as initially loaded so pagination will work
        hasInitiallyLoaded.current = true;
      } else {
        setRecords([]);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalRecords: 0,
          totalPages: 0
        }));
        // Mark as initially loaded even if no results
        hasInitiallyLoaded.current = true;
      }
    } catch (error) {
      console.error('Error performing DLN search:', error);
      setError('Error performing search. Please try again.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle clear filters
  const handleClear = () => {
    setSearchFilters({
      dln: '',
      tin: '',
      nameControl: ''
    });
  };

  // Handle pagination changes
  const handlePaginationChange = (newPagination: PaginationState) => {
    setPagination(newPagination);
  };

  // Helper function to determine button text based on record status
  const getButtonText = (status: string, inventoryId: string) => {
    if (loadingStates[inventoryId]) {
      return status === 'DELETED' ? 'Undeleting...' : 'Assigning...';
    }
    return status === 'DELETED' ? 'Undelete' : 'Assign';
  };

  // Helper function to determine if button should be disabled
  const isButtonDisabled = (inventoryId: string) => {
    return loadingStates[inventoryId] || false;
  };

  // Handle assign functionality
  const handleAssign = useCallback(async (record: DLNSearchRecord) => {
    const inventoryId = record.inventoryId;
    
    if (!inventoryId) {
      setFlashMessage("No inventory ID available.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Set loading state for this specific record
    setLoadingStates(prev => ({ ...prev, [inventoryId]: true }));

    try {
      console.log('Making PATCH request to assign record:', inventoryId);
      
      const response = await fetch(`/api/v1/era/inventories/${inventoryId}/to-items/event`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({ eventStatus: 'ASSIGN_TO_SELF_EVENT' })
      });

      console.log('Assign response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Assign response:', result);
        
        // Store the eraDto in sessionStorage for the workRecord page
        sessionStorage.setItem('eraDto', JSON.stringify(result));
        
        // Navigate to workRecord page
        router.push('/workRecord');
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to assign record';
        
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Error assigning record:', errorMessage);
        setError(errorMessage);
        throw new Error(errorMessage);
        // setFlashMessage(errorMessage);
        // setShowFlash(true);
        // setTimeout(() => setShowFlash(false), 5000);
      }
    } catch (error) {
      console.error('Error assigning record:', error);
      setFlashMessage('Error assigning record. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      // Clear loading state for this specific record
      setLoadingStates(prev => ({ ...prev, [inventoryId]: false }));
    }
  }, [currentUserSeid, router]);

  // Handle undelete functionality
  const handleUndelete = useCallback(async (record: DLNSearchRecord) => {
    const inventoryId = record.inventoryId;
    
    if (!inventoryId) {
      setFlashMessage("No inventory ID available.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Set loading state for this specific record
    setLoadingStates(prev => ({ ...prev, [inventoryId]: true }));

    try {
      console.log('Making PATCH request to undelete record:', inventoryId);
      
      const response = await fetch(`/api/v1/era/inventories/${inventoryId}/event`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'SEID': `${currentUserSeid}`
        },
        body: JSON.stringify({ eventStatus: 'UNDO_DELETE_EVENT' })
      });

      console.log('Undelete response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Undelete response:', result);
        
        // Update the record status in the local state
        setRecords(prevRecords => 
          prevRecords.map(r => 
            r.inventoryId === inventoryId 
              ? { ...r, status: 'NEW' } // Update status to NEW after undelete
              : r
          )
        );
        
        setFlashMessage('Record undeleted successfully');
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to undelete record';
        
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Error undeleting record:', errorMessage);
        setFlashMessage(errorMessage);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 5000);
      }
    } catch (error) {
      console.error('Error undeleting record:', error);
      setFlashMessage('Error undeleting record. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      // Clear loading state for this specific record
      setLoadingStates(prev => ({ ...prev, [inventoryId]: false }));
    }
  }, [currentUserSeid]);

  // Handle button click based on record status
  // const handleButtonClick = useCallback((record: DLNSearchRecord) => {
  //   const assignableStatuses = ['NEW', 'SUSPENDED', 'QR_HOLD', 'SUSPEND', 'HOLD', 'RESOLVED'];
  //   const assignableStatuses = ['NEW', 'SUSPENDED', 'QR_HOLD', 'WORKABLE_SUSPENSE'];

  //   if (record.status === 'DELETED') {
  //     handleUndelete(record);
  //   } else if (assignableStatuses.includes(record.status)) {
  //     handleAssign(record);
  //   }
  // }, [handleAssign, handleUndelete]);

  // using handleAssign for both assign and undelete
  const handleButtonClick = useCallback((record: DLNSearchRecord) => {
    handleAssign(record);
  }, [handleAssign]);

  const columnHelper = createColumnHelper<DLNSearchRecord>();

  // DLN search columns - similar to daily summary
  const dlnSearchColumns = useMemo<ColumnDef<DLNSearchRecord, any>[]>(() => [
    columnHelper.accessor('dln', {
      header: 'DLN',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue()}</span>
      ),
      size: 150,
    }),
    columnHelper.accessor('serviceCenterId', {
      header: 'Service Center',
      cell: ({ getValue }) => {
        return getServiceCenterName(getValue());
      },
      size: 120,
    }),
    columnHelper.display({
      id: 'programCode',
      header: 'Program Code',
      cell: () => {
        // Get program code from session storage (client-side only)
        if (typeof window !== 'undefined') {
          const selectionData = sessionStorage.getItem('selectionData');
          const parsedData = selectionData ? JSON.parse(selectionData) : {};
          return <span>{parsedData.program || 'N/A'}</span>;
        }
        return <span>N/A</span>;
      },
      size: 120,
    }),
    columnHelper.accessor('formType', {
      header: 'Form Type',
      size: 100,
    }),
    columnHelper.accessor('taxPeriod', {
      header: 'Tax Period',
      size: 100,
    }),
    columnHelper.accessor('submissionNames', {
      header: 'Name Control',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue() || 'N/A'}</span>
      ),
      size: 120,
    }),
    columnHelper.accessor('submissionTins', {
      header: 'SSN/TIN',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue() || 'N/A'}</span>
      ),
      size: 120,
    }),
    columnHelper.accessor('submissionErrorCodes', {
      header: 'Errors',
      cell: ({ getValue }) => {
        const errorCodes = getValue();
        const errors = errorCodes ? errorCodes.split(',') : [];
        return (
          <div className="max-w-48">
            <div className="truncate" title={errors.join(', ')}>
              {errors.join(', ') || 'None'}
            </div>
          </div>
        );
      },
      size: 150,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('seid', {
      header: 'Assigned To',
      cell: ({ getValue, row }) => {
        const seid = getValue();
        const status = row.original.status;
        
        // Only show SEID if status is 'ASSIGNED'
        if (status === 'ASSIGNED') {
          return <span className="font-mono text-xs">{seid || ''}</span>;
        }
        
        // Return empty for all other statuses
        return <span></span>;
      },
      size: 100,
    }),
    columnHelper.accessor('controlDay', {
      header: 'Control Day',
      size: 100,
    }),
    columnHelper.accessor('updatedDate', {
      header: 'Updated Date',
      size: 120,
    }),
    // Add dynamic action button column
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const record = row.original;
        // const assignableStatuses = ['NEW', 'SUSPENDED', 'QR_HOLD', 'SUSPEND', 'HOLD', 'RESOLVED'];
        const assignableStatuses = ['NEW', 'SUSPENDED', 'WORKABLE_SUSPENSE'];
        const isAssignable = assignableStatuses.includes(record.status);
        const isDeleted = record.status === 'DELETED';
        const showButton = isAssignable || isDeleted;
        
        if (!showButton) {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }
        
        return (
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent row click
              handleButtonClick(record);
            }}
            disabled={isButtonDisabled(record.inventoryId.toString())}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors duration-200 ${
              isDeleted
                ? 'bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
            } disabled:cursor-not-allowed`}
          >
            {getButtonText(record.status, record.inventoryId.toString())}
          </button>
        );
      },
      size: 100,
    }),
  ], [columnHelper, handleButtonClick, getButtonText, isButtonDisabled]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="px-4 pt-4 pb-2">
        <Breadcrumbs items={[
          { label: 'Home', href: '/home' },
          { label: 'DLN Search Results', isActive: true }
        ]} />
      </div>
      
      {showFlash && (
        <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right ${
          flashMessage.includes('Error') || flashMessage.includes('Failed') 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          <span>{flashMessage}</span>
        </div>
      )}
      
      <div id="main-content" className="main-container p-4 mx-auto">
        <div className="center-panel bg-white rounded-lg shadow-sm p-6 flex flex-col h-full">
          {/* Header */}
          <div className="card-header flex justify-between items-center mb-2 pb-2 border-b-2 border-gray-100">
            <div className="flex items-center gap-4">
              {/* <button
                onClick={() => router.back()}
                className="back-button inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </button> */}
              <div>
                <h2 className="card-title text-xl font-semibold text-[#003d6b]">
                  DLN Search Results
                </h2>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  {/* {dlnQuery && (
                    <p>DLN: <span className="font-mono">{dlnQuery}</span></p>
                  )} */}
                  <p>Found {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          {/* <div className="toolbar flex justify-between items-center gap-4 mb-6">
          </div> */}

          {/* Search Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            {/* DLN Input */}
            <div className="relative w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DLN
              </label>
              <input
                type="text"
                placeholder="Enter DLN"
                value={searchFilters.dln}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dln: e.target.value }))}
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={17}
              />
            </div>

            {/* TIN Input */}
            <div className="relative w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TIN
              </label>
              <input
                type="text"
                placeholder="Enter TIN"
                value={searchFilters.tin}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, tin: e.target.value }))}
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={11}
              />
            </div>

            {/* Name Control Input */}
            <div className="relative w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name Control
              </label>
              <input
                type="text"
                placeholder="Enter name control"
                value={searchFilters.nameControl}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, nameControl: e.target.value }))}
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                maxLength={4}
              />
            </div>

            {/* Submit and Clear Buttons */}
            <div className="flex gap-2 items-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Submit'}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                title="Clear Filters"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <ErrorAlert 
              message={error} 
              onClose={() => setError(null)} 
            />
          )}

          {/* Table */}
          <div className="grid-container">
            {loading ? (
              <TableLoadingState />
            ) : filteredRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {/* {dlnQuery ? `No records found for DLN: ${dlnQuery}` : 'No records found matching your search criteria.'} */}
                    {'No records found matching your search criteria.'}
                  </p>
                  <button
                    onClick={loadDLNSearchRecords}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <TanStackInventoryTable<DLNSearchRecord>
                records={filteredRecords}
                selectedRecords={[]}
                onSelectionChange={() => {}}
                onRowClick={undefined}
                columns={dlnSearchColumns}
                getRecordId={(record) => record.inventoryId.toString()}
              />
            )}
          </div>

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
          />
        </div>
      </div>
    </div>
  );
}

export default function DLNSearch() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <DLNSearchContent />
    </Suspense>
  );
}
