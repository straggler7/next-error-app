'use client';

import { useState, useEffect } from 'react';
import BaseReport from '../../../components/BaseReport';
import { ReportRecord, ReportPayload, ReportsService } from '../../../services/reportsService';
import { useSeid } from '../../../hooks/useSeid';

export default function Report7747() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const seid = useSeid();

  const handleRefresh = async (payload: ReportPayload) => {
    if (!seid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get7747Report(seid, payload);
      setData(reportData);
    } catch (error) {
      console.error('Error fetching 7747 report:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (payload: ReportPayload) => {
    if (!seid) return;
    
    try {
      // Make API call with export flag
      const exportData = await ReportsService.get7747Report(seid, payload);
      
      // Download as CSV
      ReportsService.downloadCSV(exportData, '7747');
    } catch (error) {
      console.error('Error exporting 7747 report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  // Initial load with default payload
  useEffect(() => {
    if (seid) {
      const defaultPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 25,
        reportId: '7747',
        startDateStr: new Date().toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
      };
      handleRefresh(defaultPayload);
    }
  }, [seid]);

  return (
    <BaseReport
      title="Program Production Summary Report"
      reportType="7747"
      data={data}
      loading={loading}
      onRefresh={handleRefresh}
      onExport={handleExport}
    />
  );
}
