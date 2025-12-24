'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportsService } from '../../../services/reportsService';
import { useSeid } from '../../../hooks/useSeid';
import { RefreshCw, Download } from 'lucide-react';
import DatePicker from '../../../components/DatePicker';

interface Report1747Data {
  // New Receipts section
  newReceiptsTotalGMFRecordAdded?: number | null;
  newReceiptsExpiredSuspense?: number | null;
  newReceiptsUnderSuspense?: number | null;
  newReceiptsNEW?: number | null;
  
  // New Error Inventory section
  newErrorInventoryBeginning?: number | null;
  newErrorInventoryResolved?: number | null;
  newErrorInventorySuspended?: number | null;
  newErrorInventoryDeleted?: number | null;
  newErrorInventoryQRhold?: number | null;
  
  // Expired Suspense Inventory section
  expiredSuspenseBeginning?: number | null;
  expiredSuspenseResolved?: number | null;
  expiredSuspenseSuspended?: number | null;
  expiredSuspenseDeleted?: number | null;
  expiredSuspenseQRhold?: number | null;
  
  // Under Suspense section
  unexpiredSuspenseBeginning?: number | null;
  unexpiredSuspenseResolved?: number | null;
  unexpiredSuspenseSuspended?: number | null;
  unexpiredSuspenseDeleted?: number | null;
  unexpiredSuspenseQRhold?: number | null;
  unexpiredSuspenseWorkableAdded?: number | null;
  unexpiredSuspenseWorkableDeleted?: number | null;
}

export default function Report1747Page() {
  const [data, setData] = useState<Report1747Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    const year = yesterday.getFullYear();
    return `${month}/${day}/${year}`;
  });
  const currentUserSeid = useSeid();

  const fetchReportData = useCallback(async () => {
    if (!currentUserSeid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get1747Report(currentUserSeid, selectedDate);
      console.log('1747 Report API Response:', reportData);
      
      // Validate and provide fallback structure
      const validatedData: Report1747Data = {
        // New Receipts
        newReceiptsTotalGMFRecordAdded: reportData?.newReceiptsTotalGMFRecordAdded || 0,
        newReceiptsExpiredSuspense: reportData?.newReceiptsExpiredSuspense || 0,
        newReceiptsUnderSuspense: reportData?.newReceiptsUnderSuspense || 0,
        newReceiptsNEW: reportData?.newReceiptsNEW || 0,
        
        // New Error Inventory
        newErrorInventoryBeginning: reportData?.newErrorInventoryBeginning || 0,
        newErrorInventoryResolved: reportData?.newErrorInventoryResolved || 0,
        newErrorInventorySuspended: reportData?.newErrorInventorySuspended || 0,
        newErrorInventoryDeleted: reportData?.newErrorInventoryDeleted || 0,
        newErrorInventoryQRhold: reportData?.newErrorInventoryQRhold || 0,
        
        // Expired Suspense Inventory
        expiredSuspenseBeginning: reportData?.expiredSuspenseBeginning || 0,
        expiredSuspenseResolved: reportData?.expiredSuspenseResolved || 0,
        expiredSuspenseSuspended: reportData?.expiredSuspenseSuspended || 0,
        expiredSuspenseDeleted: reportData?.expiredSuspenseDeleted || 0,
        expiredSuspenseQRhold: reportData?.expiredSuspenseQRhold || 0,
        
        // Under Suspense
        unexpiredSuspenseBeginning: reportData?.unexpiredSuspenseBeginning || 0,
        // unexpiredSuspenseResolved: reportData?.unexpiredSuspenseResolved || 0,
        // unexpiredSuspenseSuspended: reportData?.unexpiredSuspenseSuspended || 0,
        // unexpiredSuspenseDeleted: reportData?.unexpiredSuspenseDeleted || 0,
        // unexpiredSuspenseQRhold: reportData?.unexpiredSuspenseQRhold || 0,
        unexpiredSuspenseWorkableAdded: reportData?.unexpiredSuspenseWorkableAdded || 0,
        unexpiredSuspenseWorkableDeleted: reportData?.unexpiredSuspenseWorkableDeleted || 0
      };
      
      setData(validatedData);
    } catch (error) {
      console.error('Error fetching 1747 report:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid, selectedDate]);

  useEffect(() => {
    // Initial load only when component mounts
    if (currentUserSeid) {
      fetchReportData();
    }
  }, [currentUserSeid]); // Remove fetchReportData dependency to prevent auto-refresh on date change

  const formatNumber = (value: number | null | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  const handleExport = async () => {
    if (!currentUserSeid || !data) return;
    
    try {
      // Convert the inventory data to a flat structure for CSV export
      const exportData = [
        // New Receipts
        { Section: 'New Receipts', Item: 'Total GMF Record Added', Value: data.newReceiptsTotalGMFRecordAdded || 0 },
        { Section: 'New Receipts', Item: 'Expired Suspense', Value: data.newReceiptsExpiredSuspense || 0 },
        { Section: 'New Receipts', Item: 'Under Suspense', Value: data.newReceiptsUnderSuspense || 0 },
        { Section: 'New Receipts', Item: 'NEW', Value: data.newReceiptsNEW || 0 },
        
        // New Error Inventory
        { Section: 'New Error Inventory', Item: 'Beginning', Value: data.newErrorInventoryBeginning || 0 },
        { Section: 'New Error Inventory', Item: 'Resolved', Value: data.newErrorInventoryResolved || 0 },
        { Section: 'New Error Inventory', Item: 'Suspended', Value: data.newErrorInventorySuspended || 0 },
        { Section: 'New Error Inventory', Item: 'Deleted', Value: data.newErrorInventoryDeleted || 0 },
        { Section: 'New Error Inventory', Item: 'QR Hold', Value: data.newErrorInventoryQRhold || 0 },
        
        // Expired Suspense
        { Section: 'Expired Suspense', Item: 'Beginning', Value: data.expiredSuspenseBeginning || 0 },
        { Section: 'Expired Suspense', Item: 'Resolved', Value: data.expiredSuspenseResolved || 0 },
        { Section: 'Expired Suspense', Item: 'Suspended', Value: data.expiredSuspenseSuspended || 0 },
        { Section: 'Expired Suspense', Item: 'Deleted', Value: data.expiredSuspenseDeleted || 0 },
        { Section: 'Expired Suspense', Item: 'QR Hold', Value: data.expiredSuspenseQRhold || 0 },
        
        // Unexpired Suspense
        { Section: 'Unexpired Suspense', Item: 'Beginning', Value: data.unexpiredSuspenseBeginning || 0 },
        { Section: 'Unexpired Suspense', Item: 'Resolved', Value: data.unexpiredSuspenseResolved || 0 },
        { Section: 'Unexpired Suspense', Item: 'Suspended', Value: data.unexpiredSuspenseSuspended || 0 },
        { Section: 'Unexpired Suspense', Item: 'Deleted', Value: data.unexpiredSuspenseDeleted || 0 },
        { Section: 'Unexpired Suspense', Item: 'QR Hold', Value: data.unexpiredSuspenseQRhold || 0 },
        { Section: 'Unexpired Suspense', Item: 'Workable Added', Value: data.unexpiredSuspenseWorkableAdded || 0 },
        { Section: 'Unexpired Suspense', Item: 'Workable Deleted', Value: data.unexpiredSuspenseWorkableDeleted || 0 }
      ];

      // Use ReportsService downloadCSV method
      ReportsService.downloadCSV(exportData as any, '1747');
    } catch (error) {
      console.error('Error exporting 1747 report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const renderSection = (title: string, fields: Array<{key: keyof Report1747Data, label: string, value: number | null | undefined}>) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold bg-[color:var(--color-irs-blue)] text-white p-3 rounded-t-lg -m-6 mb-4">
        {title}
      </h3>
      <div className="space-y-3">
        {fields.map(({ key, label, value }) => (
          <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-gray-700 font-medium">{label}:</span>
            <span className="text-gray-900 font-semibold">{formatNumber(value)}</span>
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchReportData()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {/* Date Picker */}
        <div className="w-48">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            label="Status On"
            placeholder="Select status date..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-2 items-end">
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      </div>

      {data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderSection(
            '1. New Receipts',
            [
              { key: 'newReceiptsTotalGMFRecordAdded', label: 'Total GMF Record Added', value: data.newReceiptsTotalGMFRecordAdded },
              { key: 'newReceiptsExpiredSuspense', label: 'Expired Suspense', value: data.newReceiptsExpiredSuspense },
              { key: 'newReceiptsUnderSuspense', label: 'Under Suspense', value: data.newReceiptsUnderSuspense },
              { key: 'newReceiptsNEW', label: 'NEW', value: data.newReceiptsNEW }
            ]
          )}

          {renderSection(
            '2. New Error Inventory',
            [
              { key: 'newErrorInventoryBeginning', label: 'Beginning', value: data.newErrorInventoryBeginning },
              { key: 'newErrorInventoryResolved', label: 'Resolved', value: data.newErrorInventoryResolved },
              { key: 'newErrorInventorySuspended', label: 'Suspended', value: data.newErrorInventorySuspended },
              { key: 'newErrorInventoryDeleted', label: 'Deleted', value: data.newErrorInventoryDeleted },
              { key: 'newErrorInventoryQRhold', label: 'QR Hold', value: data.newErrorInventoryQRhold }
            ]
          )}

          {renderSection(
            '3. Expired Suspense',
            [
              { key: 'expiredSuspenseBeginning', label: 'Beginning', value: data.expiredSuspenseBeginning },
              { key: 'expiredSuspenseResolved', label: 'Resolved', value: data.expiredSuspenseResolved },
              { key: 'expiredSuspenseSuspended', label: 'Suspended', value: data.expiredSuspenseSuspended },
              { key: 'expiredSuspenseDeleted', label: 'Deleted', value: data.expiredSuspenseDeleted },
              { key: 'expiredSuspenseQRhold', label: 'QR Hold', value: data.expiredSuspenseQRhold }
            ]
          )}

          {renderSection(
            '4. Unexpired Suspense',
            [
              { key: 'unexpiredSuspenseBeginning', label: 'Beginning', value: data.unexpiredSuspenseBeginning },
              { key: 'unexpiredSuspenseResolved', label: 'Resolved', value: data.unexpiredSuspenseResolved },
              { key: 'unexpiredSuspenseSuspended', label: 'Suspended', value: data.unexpiredSuspenseSuspended },
              { key: 'unexpiredSuspenseDeleted', label: 'Deleted', value: data.unexpiredSuspenseDeleted },
              { key: 'unexpiredSuspenseQRhold', label: 'QR Hold', value: data.unexpiredSuspenseQRhold },
              { key: 'unexpiredSuspenseWorkableAdded', label: 'Workable Added', value: data.unexpiredSuspenseWorkableAdded },
              { key: 'unexpiredSuspenseWorkableDeleted', label: 'Workable Deleted', value: data.unexpiredSuspenseWorkableDeleted }
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
