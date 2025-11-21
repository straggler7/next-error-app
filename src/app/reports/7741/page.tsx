'use client';

import { useState, useEffect } from 'react';
import BaseReport from '../../../components/BaseReport';
import { ReportRecord, ReportPayload, ReportsService } from '../../../services/reportsService';
import { useSeid } from '../../../hooks/useSeid';

export default function Report7741() {
  const [data, setData] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const seid = useSeid();

  const handleRefresh = async (payload: ReportPayload) => {
    if (!seid) return;
    
    setLoading(true);
    try {
      const reportData = await ReportsService.get7741Report(seid, payload);
      setData(reportData);
    } catch (error) {
      console.error('Error fetching 7741 report:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load with default payload
  useEffect(() => {
    if (seid) {
      const defaultPayload: ReportPayload = {
        pageNumber: 1,
        pageSize: 25,
        reportId: '7741',
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
      reportType="7741"
      data={data}
      loading={loading}
      onRefresh={handleRefresh}
    />
  );
}
