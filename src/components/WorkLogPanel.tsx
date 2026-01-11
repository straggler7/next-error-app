import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import WorkLogCard from './WorkLogCard';
import { ReportsService, ReportPayload, ReportRecord } from '../services/reportsService';
import { useSeid } from '../hooks/useSeid';

interface WorkLogPanelProps {
  className?: string;
}

interface WorkLogData {
  [programCode: string]: {
    programCode: string;
    totalTimeSpentStr?: string;
    volumePerHr?: number;
    resolvedQty?: number;
    deletedQty?: number;
    suspendedQty?: number;
    reWorkedQty?: number;
    totalVolume?: number;
  };
}

export default function WorkLogPanel({ className = '' }: WorkLogPanelProps) {
  const [workLogData, setWorkLogData] = useState<WorkLogData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seid = useSeid();

  const fetchWorkLogData = useCallback(async () => {
    if (!seid) return;

    setLoading(true);
    setError(null);

    try {
      // Create payload for 7746 report (Tax Examiner Production Report)
      const today = new Date();
      const payload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100, // Get more records to ensure we capture all program codes
        reportId: '7746',
        startDateStr: today.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
        endDateStr: today.toLocaleDateString('en-US', { 
          month: '2-digit', 
          day: '2-digit', 
          year: 'numeric' 
        }),
        seid: seid // Include the current user's SEID
      };

      const reportData = await ReportsService.get7746Report(seid, payload);
      
      // Group data by program code
      const groupedData: WorkLogData = {};
      
      reportData.forEach((record: ReportRecord) => {
        const programCode = record.programId || 'Unknown';
        
        if (!groupedData[programCode]) {
          groupedData[programCode] = {
            programCode,
            totalTimeSpentStr: '0.00',
            volumePerHr: 0,
            resolvedQty: 0,
            deletedQty: 0,
            suspendedQty: 0,
            reWorkedQty: 0,
            totalVolume: 0
          };
        }

        // Aggregate the data for this program code
        const existing = groupedData[programCode];
        existing.totalTimeSpentStr = record.totalTimeSpentStr || existing.totalTimeSpentStr;
        existing.volumePerHr = (existing.volumePerHr || 0) + (record.volumePerHr || 0);
        existing.resolvedQty = (existing.resolvedQty || 0) + (record.resolvedQty || 0);
        existing.deletedQty = (existing.deletedQty || 0) + (record.deletedQty || 0);
        existing.suspendedQty = (existing.suspendedQty || 0) + (record.suspendedQty || 0);
        existing.reWorkedQty = (existing.reWorkedQty || 0) + (record.reWorkedQty || 0);
        existing.totalVolume = (existing.totalVolume || 0) + (record.totalVolume || 0);
      });

      setWorkLogData(groupedData);
    } catch (err) {
      console.error('Error fetching work log data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch work log data');
    } finally {
      setLoading(false);
    }
  }, [seid]);

  useEffect(() => {
    fetchWorkLogData();
  }, [fetchWorkLogData]);

  const programCodes = Object.keys(workLogData).sort();

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="card-header flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
        <h2 className="card-title text-xl font-semibold text-[#003d6b]">Work Log</h2>
        <button
          onClick={fetchWorkLogData}
          disabled={loading}
          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      {loading && programCodes.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
          <button
            onClick={fetchWorkLogData}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      ) : programCodes.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-sm">
            No work log data available for today.
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 ${programCodes.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {programCodes.map((programCode) => (
            <WorkLogCard
              key={programCode}
              data={workLogData[programCode]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
