'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { SubmissionRecord } from '../types';
import StatusBadge from './StatusBadge';

interface TanStackInventoryTableProps {
  records: SubmissionRecord[];
  selectedRecords: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const columnHelper = createColumnHelper<SubmissionRecord>();

export default function TanStackInventoryTable({ 
  records, 
  selectedRecords, 
  onSelectionChange 
}: TanStackInventoryTableProps) {
  
  const columns = useMemo<ColumnDef<SubmissionRecord, any>[]>(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedRecords.includes(row.original.id)}
          onChange={(e) => {
            const isChecked = e.target.checked;
            const recordId = row.original.id;
            
            if (isChecked) {
              onSelectionChange([...selectedRecords, recordId]);
            } else {
              onSelectionChange(selectedRecords.filter(id => id !== recordId));
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      size: 50,
    }),
    columnHelper.accessor('id', {
      header: 'ID',
      cell: ({ getValue, row }) => (
        <Link 
          href={`/details/${row.original.dln}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {getValue()}
        </Link>
      ),
      size: 120,
    }),
    columnHelper.accessor('dln', {
      header: 'DLN',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{getValue()}</span>
      ),
      size: 150,
    }),
    columnHelper.accessor('serviceCenter', {
      header: 'Service Center',
      size: 120,
    }),
    columnHelper.accessor('formType', {
      header: 'Form Type',
      size: 100,
    }),
    columnHelper.accessor('returnType', {
      header: 'Return Type',
      size: 100,
    }),
    columnHelper.accessor('taxPeriod', {
      header: 'Tax Period',
      size: 100,
    }),
    columnHelper.accessor('errors', {
      header: 'Errors',
      cell: ({ getValue }) => {
        const errors = getValue();
        return (
          <div className="max-w-48">
            <div className="truncate" title={errors.join(', ')}>
              {errors.join(', ')}
            </div>
          </div>
        );
      },
      size: 200,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => (
        <StatusBadge status={getValue()} />
      ),
      size: 100,
    }),
    columnHelper.accessor('assignedTo', {
      header: 'Assigned To',
      size: 120,
    }),
    columnHelper.accessor('controlDay', {
      header: 'Control Day',
      size: 100,
    }),
    columnHelper.accessor('updatedDate', {
      header: 'Updated Date',
      size: 120,
    }),
  ], [selectedRecords, onSelectionChange]);

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`
                cursor-pointer transition-colors duration-200 border-b border-gray-200
                ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                hover:bg-blue-50
                ${selectedRecords.includes(row.original.id) ? 'bg-blue-100' : ''}
              `}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="p-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
