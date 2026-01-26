'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportsService, ReportRecord, ReportPayload } from '../../../services/reportsService';
import BaseReport from '../../../components/BaseReport';
import { useSeid } from '../../../hooks/useSeid';

export default function Report1343Page() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUserSeid = useSeid();

  const fetchReportData = useCallback(async (payload: ReportPayload) => {
    if (!currentUserSeid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get1343Report(currentUserSeid, payload);
      setData(reportData);
    } catch (error) {
      console.error('Error fetching 1343 report:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch 1343 report');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid]);

  useEffect(() => {
    // Initial load with default payload
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    const year = yesterday.getFullYear();
    
    const defaultPayload: ReportPayload = {
      pageNumber: 1,
      pageSize: 20,
      reportId: '1343',
      startDateStr: `${month}/${day}/${year}`,
    };
    
    fetchReportData(defaultPayload);
  }, [currentUserSeid, fetchReportData]);

  const handleExport = async (payload: ReportPayload, columns: { key: string; label: string; visible: boolean }[]) => {
    if (!currentUserSeid) return;
    
    try {
      // Make API call with export flag
      const exportData = await ReportsService.get1343Report(currentUserSeid, payload);
      
      // Download as CSV
      ReportsService.downloadCSV(exportData, '1343', columns);
    } catch (error) {
      console.error('Error exporting 1343 report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <BaseReport
      title="Suspense Summary Report (1343)"
      reportType="1343"
      data={data}
      loading={loading}
      onRefresh={fetchReportData}
      onExport={handleExport}
      error={error}
    />
  );
}
