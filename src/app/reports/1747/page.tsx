'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportsService } from '../../../services/reportsService';
import { useSeid } from '../../../hooks/useSeid';
import { RefreshCw, Download } from 'lucide-react';

interface InventorySection {
  beginningInventory?: number;
  totalRecordsAddedFromGmf?: number;
  workableSuspenseSelected?: number;
  unworkableSuspenseSelected?: number;
  errorRecordsSelected?: number;
  endingInventory?: number;
  errorInventoryRecords?: number;
  recordsCorrected?: number;
  recordsSuspended?: number;
  recordsRejected?: number;
  duplicateRecordsDropped?: number;
  duplicateBlockRecordsMovedToSuspense?: number;
  qualityAssuranceHold?: number;
  returnsAnalysisRecordsAdded?: number;
  gufRecordsAdded?: number;
  unworkableSuspenseRecordsAdded?: number;
  duplicateBlockErrorRecordsAdded?: number;
  workableSuspenseRecordsAdded?: number;
  workableSuspenseRecordsRemoved?: number;
  duplicateRecordsRemoved?: number;
  errorRecordsAdded?: number;
}

interface Report1747Data {
  selectionInventory: InventorySection;
  errorInventory: InventorySection;
  workableSuspenseInventory: InventorySection;
  unworkableSuspenseInventory: InventorySection;
}

export default function Report1747Page() {
  const [data, setData] = useState<Report1747Data | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUserSeid = useSeid();

  const fetchReportData = useCallback(async () => {
    if (!currentUserSeid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get1747Report(currentUserSeid);
      console.log('1747 Report API Response:', reportData);
      
      // Validate and provide fallback structure
      const validatedData: Report1747Data = {
        selectionInventory: reportData?.selectionInventory || {},
        errorInventory: reportData?.errorInventory || {},
        workableSuspenseInventory: reportData?.workableSuspenseInventory || {},
        unworkableSuspenseInventory: reportData?.unworkableSuspenseInventory || {}
      };
      
      setData(validatedData);
    } catch (error) {
      console.error('Error fetching 1747 report:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  const handleExport = async () => {
    if (!currentUserSeid || !data) return;
    
    try {
      // Convert the inventory data to a flat structure for CSV export
      const exportData = [
        // Selection Inventory
        { Section: 'Selection Inventory', Item: 'Beginning Inventory', Value: data.selectionInventory.beginningInventory || 0 },
        { Section: 'Selection Inventory', Item: 'Total Records Added From GMF', Value: data.selectionInventory.totalRecordsAddedFromGmf || 0 },
        { Section: 'Selection Inventory', Item: 'Workable Suspense Selected', Value: data.selectionInventory.workableSuspenseSelected || 0 },
        { Section: 'Selection Inventory', Item: 'Unworkable Suspense Selected', Value: data.selectionInventory.unworkableSuspenseSelected || 0 },
        { Section: 'Selection Inventory', Item: 'Error Records Selected', Value: data.selectionInventory.errorRecordsSelected || 0 },
        { Section: 'Selection Inventory', Item: 'Ending Inventory', Value: data.selectionInventory.endingInventory || 0 },
        
        // Error Inventory
        { Section: 'Error Inventory', Item: 'Beginning Inventory', Value: data.errorInventory.beginningInventory || 0 },
        { Section: 'Error Inventory', Item: 'Error Records Selected', Value: data.errorInventory.errorRecordsSelected || 0 },
        { Section: 'Error Inventory', Item: 'Records Corrected', Value: data.errorInventory.recordsCorrected || 0 },
        { Section: 'Error Inventory', Item: 'Records Suspended', Value: data.errorInventory.recordsSuspended || 0 },
        { Section: 'Error Inventory', Item: 'Records Rejected', Value: data.errorInventory.recordsRejected || 0 },
        { Section: 'Error Inventory', Item: 'Duplicate Records Dropped', Value: data.errorInventory.duplicateRecordsDropped || 0 },
        { Section: 'Error Inventory', Item: 'Duplicate Block Records Moved to Suspense', Value: data.errorInventory.duplicateBlockRecordsMovedToSuspense || 0 },
        { Section: 'Error Inventory', Item: 'Ending Inventory', Value: data.errorInventory.endingInventory || 0 },
        { Section: 'Error Inventory', Item: 'Quality Assurance Hold', Value: data.errorInventory.qualityAssuranceHold || 0 },
        
        // Workable Suspense Inventory
        { Section: 'Workable Suspense Inventory', Item: 'Beginning Inventory', Value: data.workableSuspenseInventory.beginningInventory || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Error Inventory Records', Value: data.workableSuspenseInventory.errorInventoryRecords || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Returns Analysis Records Added', Value: data.workableSuspenseInventory.returnsAnalysisRecordsAdded || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'GUF Records Added', Value: data.workableSuspenseInventory.gufRecordsAdded || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Unworkable Suspense Records Added', Value: data.workableSuspenseInventory.unworkableSuspenseRecordsAdded || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Duplicate Block Error Records Added', Value: data.workableSuspenseInventory.duplicateBlockErrorRecordsAdded || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Records Corrected', Value: data.workableSuspenseInventory.recordsCorrected || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Records Suspended', Value: data.workableSuspenseInventory.recordsSuspended || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Records Rejected', Value: data.workableSuspenseInventory.recordsRejected || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Duplicate Records Dropped', Value: data.workableSuspenseInventory.duplicateRecordsDropped || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Ending Inventory', Value: data.workableSuspenseInventory.endingInventory || 0 },
        { Section: 'Workable Suspense Inventory', Item: 'Quality Assurance Hold', Value: data.workableSuspenseInventory.qualityAssuranceHold || 0 },
        
        // Unworkable Suspense Inventory
        { Section: 'Unworkable Suspense Inventory', Item: 'Beginning Inventory', Value: data.unworkableSuspenseInventory.beginningInventory || 0 },
        { Section: 'Unworkable Suspense Inventory', Item: 'Error Records Added', Value: data.unworkableSuspenseInventory.errorRecordsAdded || 0 },
        { Section: 'Unworkable Suspense Inventory', Item: 'Returns Analysis Records Added', Value: data.unworkableSuspenseInventory.returnsAnalysisRecordsAdded || 0 },
        { Section: 'Unworkable Suspense Inventory', Item: 'Workable Suspense Records Added', Value: data.unworkableSuspenseInventory.workableSuspenseRecordsAdded || 0 },
        { Section: 'Unworkable Suspense Inventory', Item: 'Workable Suspense Records Removed', Value: data.unworkableSuspenseInventory.workableSuspenseRecordsRemoved || 0 },
        { Section: 'Unworkable Suspense Inventory', Item: 'Duplicate Records Removed', Value: data.unworkableSuspenseInventory.duplicateRecordsRemoved || 0 },
        { Section: 'Unworkable Suspense Inventory', Item: 'Ending Inventory', Value: data.unworkableSuspenseInventory.endingInventory || 0 }
      ];

      // Use ReportsService downloadCSV method
      ReportsService.downloadCSV(exportData as any, '1747');
    } catch (error) {
      console.error('Error exporting 1747 report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const renderSection = (title: string, data: InventorySection, fields: Array<{key: keyof InventorySection, label: string}>) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold bg-[color:var(--color-irs-blue)] text-white p-3 rounded-t-lg -m-6 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {fields.map(({ key, label }) => (
          <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-gray-700 font-medium">{label}:</span>
            <span className="text-gray-900 font-semibold">{formatNumber(data[key] as number)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="card-header flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
          <div>
            <h2 className="card-title text-xl font-semibold text-[#003d6b]">
              Report 1747: Error Resolution Inventory Control
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={true}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium opacity-50"
            >
              <RefreshCw size={16} className="mr-2 animate-spin" />
              Refresh
            </button>
            <button
              disabled={true}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium opacity-50"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* <Breadcrumbs items={[
        { label: 'Home', href: '/home' },
        { label: 'Error Resolution Inventory Control', isActive: true }
      ]} /> */}
      
      {/* Header */}
      <div className="card-header flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
        <div>
          <h2 className="card-title text-xl font-semibold text-[#003d6b]">
            Report 1747: Error Resolution Inventory Control
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 hover:border-gray-400 hover:text-gray-900 hover:-translate-y-0.5"
          >
            <Download size={16} className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSection(
            '1. Selection Inventory',
            data.selectionInventory,
            [
              { key: 'beginningInventory', label: 'Beginning Inventory' },
              { key: 'totalRecordsAddedFromGmf', label: 'Total Records Added From GMF' },
              { key: 'workableSuspenseSelected', label: 'Workable Suspense Selected' },
              { key: 'unworkableSuspenseSelected', label: 'Unworkable Suspense Selected' },
              { key: 'errorRecordsSelected', label: 'Error Records Selected' },
              { key: 'endingInventory', label: 'Ending Inventory' }
            ]
          )}

          {renderSection(
            '2. Error Inventory',
            data.errorInventory,
            [
              { key: 'beginningInventory', label: 'Beginning Inventory' },
              { key: 'errorRecordsSelected', label: 'Error Records Selected' },
              { key: 'recordsCorrected', label: 'Records Corrected' },
              { key: 'recordsSuspended', label: 'Records Suspended' },
              { key: 'recordsRejected', label: 'Records Rejected' },
              { key: 'duplicateRecordsDropped', label: 'Duplicate Records Dropped' },
              { key: 'duplicateBlockRecordsMovedToSuspense', label: 'Duplicate Block Records Moved to Suspense' },
              { key: 'endingInventory', label: 'Ending Inventory' },
              { key: 'qualityAssuranceHold', label: 'Quality Assurance Hold' }
            ]
          )}

          {renderSection(
            '3. Workable Suspense Inventory',
            data.workableSuspenseInventory,
            [
              { key: 'beginningInventory', label: 'Beginning Inventory' },
              { key: 'errorInventoryRecords', label: 'Error Inventory Records' },
              { key: 'returnsAnalysisRecordsAdded', label: 'Returns Analysis Records Added' },
              { key: 'gufRecordsAdded', label: 'GUF Records Added' },
              { key: 'unworkableSuspenseRecordsAdded', label: 'Unworkable Suspense Records Added' },
              { key: 'duplicateBlockErrorRecordsAdded', label: 'Duplicate Block Error Records Added' },
              { key: 'recordsCorrected', label: 'Records Corrected' },
              { key: 'recordsSuspended', label: 'Records Suspended' },
              { key: 'recordsRejected', label: 'Records Rejected' },
              { key: 'duplicateRecordsDropped', label: 'Duplicate Records Dropped' },
              { key: 'endingInventory', label: 'Ending Inventory' },
              { key: 'qualityAssuranceHold', label: 'Quality Assurance Hold' }
            ]
          )}

          {renderSection(
            '4. Unworkable Suspense Inventory',
            data.unworkableSuspenseInventory,
            [
              { key: 'beginningInventory', label: 'Beginning Inventory' },
              { key: 'errorRecordsAdded', label: 'Error Records Added' },
              { key: 'returnsAnalysisRecordsAdded', label: 'Returns Analysis Records Added' },
              { key: 'workableSuspenseRecordsAdded', label: 'Workable Suspense Records Added' },
              { key: 'workableSuspenseRecordsRemoved', label: 'Workable Suspense Records Removed' },
              { key: 'duplicateRecordsRemoved', label: 'Duplicate Records Removed' },
              { key: 'endingInventory', label: 'Ending Inventory' }
            ]
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-500">Unable to load inventory control data. Please try refreshing the report.</p>
        </div>
      )}
    </div>
  );
}
