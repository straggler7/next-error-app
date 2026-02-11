import React from 'react';

interface WorkLogCardData {
  programCode: string;
  totalTimeSpentStr?: string;
  rateofProduction?: number;
  resolvedQty?: number;
  deletedQty?: number;
  suspendedQty?: number;
  reWorkedQty?: number;
  totalVolume?: number;
}

interface WorkLogCardProps {
  data: WorkLogCardData;
}

export default function WorkLogCard({ data }: WorkLogCardProps) {
  const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  const formatTime = (timeStr: string | undefined): string => {
    if (!timeStr) return '0.00';
    return timeStr;
  };

  const calculateTotalVolume = (): number => {
    const resolved = data.resolvedQty || 0;
    const deleted = data.deletedQty || 0;
    const suspended = data.suspendedQty || 0;
    const reworked = data.reWorkedQty || 0;
    return resolved + deleted + suspended + reworked;
  };

  const totalVolume = data.totalVolume || calculateTotalVolume();

  return (
    <div className="bg-white rounded-lg shadow-md mb-4">
      <h3 className="text-sm font-semibold bg-[color:var(--color-irs-blue)] text-white p-3 rounded-t-lg">
        Program Code: {data.programCode}
      </h3>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-700 font-medium text-sm">Total Hours Worked:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatTime(data.totalTimeSpentStr)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-700 font-medium text-sm">Total Volume Worked:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatNumber(totalVolume)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-700 font-medium text-sm">Volume Per Hour:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatNumber(data.rateofProduction)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-700 font-medium text-sm">Resolved:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatNumber(data.resolvedQty)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-700 font-medium text-sm">Deleted:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatNumber(data.deletedQty)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1 border-b border-gray-100">
          <span className="text-gray-700 font-medium text-sm">Suspended:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatNumber(data.suspendedQty)}</span>
        </div>
        
        <div className="flex justify-between items-center py-1">
          <span className="text-gray-700 font-medium text-sm">Reworked:</span>
          <span className="text-gray-900 font-semibold text-sm">{formatNumber(data.reWorkedQty)}</span>
        </div>
      </div>
    </div>
  );
}
