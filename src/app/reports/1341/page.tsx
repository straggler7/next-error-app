'use client';

import { useState, useEffect } from 'react';
import { ReportsService, ReportRecord, ReportPayload } from '../../../services/reportsService';
import BaseReport from '../../../components/BaseReport';
import { useSeid } from '../../../hooks/useSeid';

export default function Report1341Page() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUserSeid = useSeid();

  const fetchReportData = async (payload: ReportPayload) => {
    if (!currentUserSeid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get1341Report(currentUserSeid, payload);
      setData(reportData);
    } catch (error) {
      console.error('Error fetching 1341 report:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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
      reportId: '1341',
      startDateStr: `${month}/${day}/${year}`,
    };
    
    fetchReportData(defaultPayload);
  }, [currentUserSeid]);

  const handleExport = async (payload: ReportPayload) => {
    if (!currentUserSeid) return;
    
    try {
      // Make API call with export flag
      const exportData = await ReportsService.get1341Report(currentUserSeid, payload);
      
      // Download as CSV
      ReportsService.downloadCSV(exportData, '1341');
    } catch (error) {
      console.error('Error exporting 1341 report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <BaseReport
      title="Error Inventory Summary"
      reportType="1341"
      data={data}
      loading={loading}
      onRefresh={fetchReportData}
      onExport={handleExport}
    />
  );
}
