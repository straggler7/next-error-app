import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import WorkLogCard from './WorkLogCard';
import DatePicker from './DatePicker';
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
    rateofProduction?: number;
  };
}

export default function WorkLogPanel({ className = '' }: WorkLogPanelProps) {
  const [workLogData, setWorkLogData] = useState<WorkLogData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today's date
    return new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  });
  const [selectedEndDate, setSelectedEndDate] = useState<string>(() => {
    // Default to today's date
    return new Date().toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: 'numeric' 
    });
  });
  const seid = useSeid();

  // Validation function to check if end date is after start date
  const isEndDateValid = (startDate: string, endDate: string): boolean => {
    if (!endDate) return true; // End date is optional
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end >= start;
  };

  const fetchWorkLogData = useCallback(async () => {
    if (!seid) return;

    setLoading(true);
    setError(null);

    try {
      // Create payload for 7746 report (Tax Examiner Production Report)
      const payload: ReportPayload = {
        pageNumber: 1,
        pageSize: 100, // Get more records to ensure we capture all program codes
        reportId: '7746',
        startDateStr: selectedDate,
        endDateStr: selectedEndDate || selectedDate, // Use end date if provided, otherwise use start date
        assignmentSeid: seid // Include the current user's SEID
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
            totalVolume: 0,
            rateofProduction: 0,
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
  }, [seid, selectedDate, selectedEndDate]);

  // Initial load on component mount only
  useEffect(() => {
    fetchWorkLogData();
  }, [seid]); // Only depend on seid, not fetchWorkLogData to prevent re-runs on date changes

  const handleSubmit = () => {
    fetchWorkLogData();
  };

  const programCodes = Object.keys(workLogData).sort();

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className} relative`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <div className="text-sm text-gray-600">Loading work summary...</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card-header mb-6 pb-2 border-b-2 border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title text-xl font-semibold text-[#003d6b]">Work Summary</h2>
          <button
            onClick={fetchWorkLogData}
            disabled={loading}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-end gap-4">
          <div className="w-full sm:w-48 sm:min-w-0 sm:flex-shrink-0">
            <DatePicker
              id="work-log-start-date-picker"
              value={selectedDate}
              onChange={setSelectedDate}
              label="Start Date"
              placeholder="Select start date..."
            />
          </div>
          <div className="w-full sm:w-48 sm:min-w-0 sm:flex-shrink-0">
            <DatePicker
              id="work-log-end-date-picker"
              value={selectedEndDate}
              onChange={setSelectedEndDate}
              label="End Date"
              placeholder="Select end date..."
            />
            {selectedEndDate && !isEndDateValid(selectedDate, selectedEndDate) && (
              <p className="text-red-500 text-xs mt-1">End date must be on or after start date</p>
            )}
          </div>
          <div className="w-full sm:w-auto sm:min-w-0">
            <button
              onClick={handleSubmit}
              disabled={loading || !isEndDateValid(selectedDate, selectedEndDate)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Loading...' : 'Submit'}
            </button>
          </div>
        </div>
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
