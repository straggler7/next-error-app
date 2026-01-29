'use client';

import { useState, useEffect, useCallback } from 'react';
import BaseReport from '../../../components/BaseReport';
import { ReportRecord, ReportPayload, ReportsService } from '../../../services/reportsService';
import { useSeid } from '../../../hooks/useSeid';

export default function Report7746() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seid = useSeid();

  const handleRefresh = useCallback(async (payload: ReportPayload) => {
    if (!seid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get7746Report(seid, payload);
      setData(reportData);
    } catch (error) {
      console.error('Error fetching 7746 report:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch 7746 report');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [seid]);

  const handleExport = async (payload: ReportPayload, columns: { key: string; label: string; visible: boolean }[]) => {
    if (!seid) return;
    
    try {
      // Make API call with export flag
      const exportData = await ReportsService.get7746Report(seid, payload);
      
      // Download as CSV
      ReportsService.downloadCSV(exportData, '7746', columns);
    } catch (error) {
      console.error('Error exporting 7746 report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  // Initial load with default payload
  useEffect(() => {
    if (seid) {
      const defaultPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 25,
        reportId: '7746',
        startDateStr: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
        endDateStr: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
      };
      handleRefresh(defaultPayload);
    }
  }, [seid, handleRefresh]);

  return (
    <BaseReport
      title="Tax Examiner Production Report (7746)"
      reportType="7746"
      data={data}
      loading={loading}
      onRefresh={handleRefresh}
      onExport={handleExport}
      error={error}
    />
  );
}
