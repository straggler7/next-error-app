'use client';

import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { QRInventoryRecord } from '../services/qrInventoryService';

interface QRInventoryTableProps {
  records: QRInventoryRecord[];
  selectedRecords: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onRowClick?: (record: QRInventoryRecord) => void;
}

const columnHelper = createColumnHelper<QRInventoryRecord>();


// export default function QRInventoryTable({ 
//   records, 
//   selectedRecords, 
//   onSelectionChange,
//   onRowClick
// }: QRInventoryTableProps) {
  
//   const columns = useMemo<ColumnDef<QRInventoryRecord, any>[]>(() => [
//     columnHelper.display({
//       id: 'select',
//       header: ({ table }) => (
//         <input
//           type="checkbox"
//           checked={table.getIsAllRowsSelected()}
//           onChange={table.getToggleAllRowsSelectedHandler()}
//           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//         />
//       ),
//       cell: ({ row }) => (
//         <input
//           type="checkbox"
//           checked={selectedRecords.includes(row.original.id)}
//           onChange={(e) => {
//             e.stopPropagation();
//             const isChecked = e.target.checked;
//             const recordId = row.original.id;
            
//             if (isChecked) {
//               onSelectionChange([...selectedRecords, recordId]);
//             } else {
//               onSelectionChange(selectedRecords.filter(id => id !== recordId));
//             }
//           }}
//           className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
//         />
//       ),
//       size: 50,
//     }),
//     columnHelper.accessor('id', {
//       header: 'ID',
//       cell: ({ getValue }) => (
//         <span className="font-medium text-blue-600">{getValue()}</span>
//       ),
//       size: 120,
//     }),
//     columnHelper.accessor('dln', {
//       header: 'DLN',
//       cell: ({ getValue }) => (
//         <span className="font-mono text-xs">{getValue()}</span>
//       ),
//       size: 150,
//     }),
//     columnHelper.accessor('serviceCenter', {
//       header: 'Service Center',
//       size: 120,
//     }),
//     columnHelper.accessor('formType', {
//       header: 'Form Type',
//       size: 100,
//     }),
//     columnHelper.accessor('returnType', {
//       header: 'Return Type',
//       size: 100,
//     }),
//     columnHelper.accessor('taxPeriod', {
//       header: 'Tax Period',
//       size: 100,
//     }),
//     columnHelper.accessor('errors', {
//       header: 'Errors',
//       cell: ({ getValue }) => {
//         const errors = getValue();
//         return (
//           <div className="max-w-48">
//             <div className="truncate" title={errors.join(', ')}>
//               {errors.join(', ')}
//             </div>
//           </div>
//         );
//       },
//       size: 200,
//     }),
//     columnHelper.accessor('qrStatus', {
//       header: 'QR Status',
//       cell: ({ getValue }) => {
//         const status = getValue();
//         const statusColors = {
//           pending: 'bg-yellow-100 text-yellow-800',
//           approved: 'bg-green-100 text-green-800',
//           rejected: 'bg-red-100 text-red-800',
//           rework: 'bg-orange-100 text-orange-800'
//         };
//         return (
//           <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
//             {status.charAt(0).toUpperCase() + status.slice(1)}
//           </span>
//         );
//       },
//       size: 120,
//     }),
//     columnHelper.accessor('assignedTo', {
//       header: 'Assigned To',
//       size: 150,
//     }),
//     columnHelper.accessor('originalAssignee', {
//       header: 'Original Assignee',
//       size: 150,
//     }),
//     columnHelper.accessor('qrReviewDate', {
//       header: 'QR Review Date',
//       size: 120,
//     }),
//     columnHelper.accessor('qrReviewer', {
//       header: 'QR Reviewer',
//       size: 150,
//     }),
//     columnHelper.accessor('controlDay', {
//       header: 'Control Day',
//       size: 100,
//     }),
//     columnHelper.accessor('updatedDate', {
//       header: 'Updated Date',
//       size: 120,
//     }),
//   ], [selectedRecords, onSelectionChange]);

//   const table = useReactTable({
//     data: records,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     enableRowSelection: true,
//   });

//   return (
//     <div className="overflow-x-auto">
//       <table className="w-full border-collapse text-sm">
//         <thead>
//           {table.getHeaderGroups().map(headerGroup => (
//             <tr key={headerGroup.id}>
//               {headerGroup.headers.map(header => (
//                 <th
//                   key={header.id}
//                   className="bg-gray-50 border-b-2 border-gray-200 font-semibold text-gray-700 p-3 text-left"
//                   style={{ width: header.getSize() }}
//                 >
//                   {header.isPlaceholder
//                     ? null
//                     : flexRender(
//                         header.column.columnDef.header,
//                         header.getContext()
//                       )}
//                 </th>
//               ))}
//             </tr>
//           ))}
//         </thead>
//         <tbody>
//           {table.getRowModel().rows.map((row, index) => (
//             <tr
//               key={row.id}
//               onClick={() => onRowClick?.(row.original)}
//               className={`
//                 cursor-pointer transition-colors duration-200 border-b border-gray-200
//                 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
//                 hover:bg-blue-50
//                 ${selectedRecords.includes(row.original.id) ? 'bg-blue-100' : ''}
//               `}
//             >
//               {row.getVisibleCells().map(cell => (
//                 <td key={cell.id} className="p-3">
//                   {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                 </td>
//               ))}
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
