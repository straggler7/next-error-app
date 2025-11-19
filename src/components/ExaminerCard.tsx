'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

export interface ExaminerData {
  name: string;
  seid: string;
  teamCode: string;
  avatar: string;
}

interface ExaminerCardProps {
  examiner: ExaminerData | null;
  onTeamChange?: (newTeam: string) => void;
  children?: React.ReactNode;
}

export default function ExaminerCard({ examiner, onTeamChange, children }: ExaminerCardProps) {
  const [teamAssignment, setTeamAssignment] = useState(examiner?.teamCode || '');

  useEffect(() => {
    setTeamAssignment(examiner?.teamCode || '');
  }, [examiner?.teamCode]);

  if (!examiner) {
    return (
      <div className="text-center text-gray-500 py-8">
        <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Select a tax examiner to assign roles</p>
      </div>
    );
  }

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTeam = e.target.value;
    setTeamAssignment(newTeam);
    if (onTeamChange) {
      onTeamChange(newTeam);
    }
  };

  return (
    <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 mt-4">
      {/* Examiner Header */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
        {/* <div className="w-15 h-15 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-xl font-semibold">
          {examiner.avatar}
        </div> */}
        <div className="examiner-info">
          <h3 className="text-md font-semibold text-gray-900 mb-1">
            {examiner.name}
          </h3>
          <p className="text-sm text-gray-600">
            SEID: {examiner.seid} | {teamAssignment}
          </p>
        </div>
      </div>

      {/* Team Assignment Section */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 mb-4">
        <div className="form-group">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Team Assignment
          </label>
          <input
            type="text"
            value={teamAssignment}
            onChange={handleTeamChange}
            placeholder="Enter team name"
            className="w-full px-2 py-2 border-1 border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-sm hover:border-gray-400"
          />
        </div>
      </div>

      {/* Role Configuration Section */}
      <div className="roles-section">
        <h4 className="text-base font-semibold text-gray-700 mb-2">
          Role Configuration
        </h4>
        {children}
      </div>
    </div>
  );
}
