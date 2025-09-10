'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SubmissionRecord } from '../types';
import StatusBadge from './StatusBadge';

interface InventoryTableProps {
  records: SubmissionRecord[];
  selectedRecords: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export default function InventoryTable({ records, selectedRecords, onSelectionChange }: InventoryTableProps) {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = records.map(record => record.id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedRecords, recordId];
    } else {
      newSelection = selectedRecords.filter(id => id !== recordId);
    }
    onSelectionChange(newSelection);
    setSelectAll(newSelection.length === records.length);
  };

  return (
    <div className="overflow-x-auto flex-1 min-h-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">ID</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">DLN</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Service Center</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Form Type</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Return Type</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Tax Period</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Errors</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Status</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Assigned To</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Control Day</th>
            <th className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left">Updated Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr
              key={record.id}
              className={`
                cursor-pointer transition-colors duration-200 border-b border-gray-200
                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                hover:bg-blue-50
                ${selectedRecords.includes(record.id) ? 'bg-blue-100' : ''}
              `}
            >
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selectedRecords.includes(record.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectRecord(record.id, e.target.checked);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="p-3">
                <Link 
                  href={`/details/${record.dln}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {record.id}
                </Link>
              </td>
              <td className="p-3 font-mono text-xs">{record.dln}</td>
              <td className="p-3">{record.serviceCenter}</td>
              <td className="p-3">{record.formType}</td>
              <td className="p-3">{record.returnType}</td>
              <td className="p-3">{record.taxPeriod}</td>
              <td className="p-3 max-w-48">
                <div className="truncate" title={record.errors.join(', ')}>
                  {record.errors.join(', ')}
                </div>
              </td>
              <td className="p-3">
                <StatusBadge status={record.status} />
              </td>
              <td className="p-3">{record.assignedTo}</td>
              <td className="p-3">{record.controlDay}</td>
              <td className="p-3">{record.updatedDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
