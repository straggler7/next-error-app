'use client';

import { useState } from 'react';

export interface StatusCode {
  code: string;
  name: string;
}

export interface ProgramRole {
  id: string;
  name: string;
  label: string;
}

export interface Program {
  id: string;
  name: string;
  roles: ProgramRole[];
  statusCodes: StatusCode[];
}

export interface RoleAssignment {
  programId: string;
  roles: string[];
  statusCodes: string[];
}

// export interface UserProfile {
//   programId: string;
//   roles: string[];
//   statusCodes: string[];
// }

interface ProgramRoleGridProps {
  programs: Program[];
  assignments: RoleAssignment[];
  onAssignmentChange: (assignments: RoleAssignment[]) => void;
}

export default function ProgramRoleGrid({ programs, assignments, onAssignmentChange }: ProgramRoleGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusSearchTerms, setStatusSearchTerms] = useState<Record<string, string>>({});

  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isProgramSelected = (programId: string) => {
    return assignments.some(assignment => assignment.programId === programId);
  };

  const isRoleSelected = (programId: string, roleId: string) => {
    const assignment = assignments.find(a => a.programId === programId);
    return assignment?.roles.includes(roleId) || false;
  };

  const isStatusCodeSelected = (programId: string, statusCode: string) => {
    const assignment = assignments.find(a => a.programId === programId);
    return assignment?.statusCodes.includes(statusCode) || false;
  };

  const isRejectRoleSelected = (programId: string) => {
    return isRoleSelected(programId, 'reject');
  };

  const toggleProgram = (programId: string) => {
    const newAssignments = [...assignments];
    const existingIndex = newAssignments.findIndex(a => a.programId === programId);
    
    if (existingIndex >= 0) {
      // Remove program assignment
      newAssignments.splice(existingIndex, 1);
    } else {
      // Add program assignment
      newAssignments.push({
        programId,
        roles: [],
        statusCodes: []
      });
    }
    
    onAssignmentChange(newAssignments);
  };

  const toggleRole = (programId: string, roleId: string) => {
    const newAssignments = [...assignments];
    let assignment = newAssignments.find(a => a.programId === programId);
    
    if (!assignment) {
      assignment = { programId, roles: [], statusCodes: [] };
      newAssignments.push(assignment);
    }
    
    const roleIndex = assignment.roles.indexOf(roleId);
    if (roleIndex >= 0) {
      assignment.roles.splice(roleIndex, 1);
      // If removing reject role, also clear status codes
      if (roleId === 'reject') {
        assignment.statusCodes = [];
      }
    } else {
      assignment.roles.push(roleId);
    }
    
    onAssignmentChange(newAssignments);
  };

  const toggleStatusCode = (programId: string, statusCode: string) => {
    const newAssignments = [...assignments];
    const assignment = newAssignments.find(a => a.programId === programId);
    
    if (!assignment) return;
    
    const statusIndex = assignment.statusCodes.indexOf(statusCode);
    if (statusIndex >= 0) {
      assignment.statusCodes.splice(statusIndex, 1);
    } else {
      assignment.statusCodes.push(statusCode);
    }
    
    onAssignmentChange(newAssignments);
  };

  const getFilteredStatusCodes = (program: Program) => {
    const searchTerm = statusSearchTerms[program.id] || '';
    return program.statusCodes.filter(sc =>
      sc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sc.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Search Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search programs..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600 focus:shadow-sm"
        />
      </div>

      {/* Programs List */}
      <div className="programs-list">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="border-b border-gray-100 last:border-b-0">
            {/* Program Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 border-b-2 border-gray-300">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProgramSelected(program.id)}
                  onChange={() => toggleProgram(program.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-base font-bold text-gray-900 tracking-wide">
                  {program.name}
                </span>
              </label>
            </div>

            {/* Program Permissions */}
            {isProgramSelected(program.id) && (
              <div className="px-4 py-4 bg-white">
                {program.roles.map((role) => (
                  <div key={role.id}>
                    {/* Role Checkbox */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-white border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-all duration-200">
                      <input
                        type="checkbox"
                        id={`${program.id}-${role.id}`}
                        checked={isRoleSelected(program.id, role.id)}
                        onChange={() => toggleRole(program.id, role.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`${program.id}-${role.id}`}
                        className="flex-1 font-medium text-gray-700 cursor-pointer"
                      >
                        {role.label}
                      </label>
                    </div>

                    {/* Status Codes Section for Reject Role */}
                    {role.id === 'reject' && isRejectRoleSelected(program.id) && (
                      <div className="bg-white border border-gray-300 rounded-lg p-5 mt-4 mb-4 ml-8 max-w-md">
                        <div className="text-sm font-semibold text-gray-700 mb-4">
                          Rejects Role Configuration
                        </div>
                        
                        {/* Status Codes Grid */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                          {/* Search Header */}
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
                            <input
                              type="text"
                              value={statusSearchTerms[program.id] || ''}
                              onChange={(e) => setStatusSearchTerms(prev => ({
                                ...prev,
                                [program.id]: e.target.value
                              }))}
                              placeholder="Search status codes..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-600"
                            />
                          </div>
                          
                          {/* Status Codes Table */}
                          <table className="w-full border-collapse">
                            <thead>
                              <tr>
                                <th className="bg-gray-50 px-3 py-3 text-left font-semibold text-gray-700 text-sm border-b border-gray-300">
                                  Status Code
                                </th>
                                <th className="bg-gray-50 px-3 py-3 text-center font-semibold text-gray-700 text-sm border-b border-gray-300 w-20">
                                  Select
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {getFilteredStatusCodes(program).map((statusCode) => (
                                <tr key={statusCode.code} className="hover:bg-blue-50">
                                  <td className="px-3 py-3 border-b border-gray-100 text-sm">
                                    {statusCode.name}
                                  </td>
                                  <td className="px-3 py-3 border-b border-gray-100 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isStatusCodeSelected(program.id, statusCode.code)}
                                      onChange={() => toggleStatusCode(program.id, statusCode.code)}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {/* Pagination Placeholder */}
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-300 text-sm">
                            <div className="text-gray-600 flex-1">
                              Showing 1-{getFilteredStatusCodes(program).length} of {program.statusCodes.length} items
                            </div>
                            <div className="flex gap-2">
                              <button className="px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50 disabled:opacity-50" disabled>
                                ‹
                              </button>
                              <button className="px-2 py-1 border border-blue-600 bg-blue-600 text-white rounded text-xs">
                                1
                              </button>
                              <button className="px-2 py-1 border border-gray-300 rounded text-xs bg-white hover:bg-gray-50">
                                ›
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
