'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportsService, ReportRecord, ReportPayload } from '../../../services/reportsService';
import BaseReport from '../../../components/BaseReport';
import { useSeid } from '../../../hooks/useSeid';

export default function ReportMERDAILPage() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUserSeid = useSeid();

  const fetchReportData = useCallback(async (payload: ReportPayload) => {
    if (!currentUserSeid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.getMERDAILReport(currentUserSeid, payload);
      setData(reportData);
    } catch (error) {
      console.error('Error fetching MERDAIL report:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch MERDAIL report');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid]);

  useEffect(() => {
    // Initial load with default payload (no filters)
    const today = new Date();
    const currentYear = today.getFullYear();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    const year = yesterday.getFullYear();
    
    const defaultPayload: ReportPayload = {
      pageNumber: 1,
      pageSize: 25,
      reportId: 'MERDAIL',
      startDateStr: `01/01/${currentYear}`,
      endDateStr: `${month}/${day}/${year}`,
      // No filters on initial load - user must submit to apply filters
    };
    
    fetchReportData(defaultPayload);
  }, [currentUserSeid, fetchReportData]);

  const handleExport = async (payload: ReportPayload, columns: { key: string; label: string; visible: boolean }[]) => {
    if (!currentUserSeid) return;
    
    try {
      // Make API call with export flag
      const exportData = await ReportsService.getMERDAILReport(currentUserSeid, payload);
      
      // Download as CSV
      ReportsService.downloadCSV(exportData, 'MERDAIL', columns);
    } catch (error) {
      console.error('Error exporting MERDAIL report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <BaseReport
      title="Error Count Report (MERDAIL / MERYRDT - INC)"
      reportType="MERDAIL"
      data={data}
      loading={loading}
      onRefresh={fetchReportData}
      onExport={handleExport}
      error={error}
    />
  );
}
