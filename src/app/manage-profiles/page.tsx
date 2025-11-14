'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useUserGroup, useSeid } from '../../hooks/useSeid';
import Header from '../../components/Header';
import Breadcrumbs, { createBreadcrumbs } from '../../components/Breadcrumbs';
import ComboBox, { ComboBoxOption } from '../../components/ComboBox';
import ExaminerCard, { ExaminerData } from '../../components/ExaminerCard';
import ProgramRoleGrid, { Program, RoleAssignment } from '../../components/ProgramRoleGrid';

// Interface for user profile API response
interface UserProfile {
  userId: string;
  seid: string;
  userName: string;
  designation: string;
  serviceCenterId: string;
  teamCode: string;
  activeStatus: boolean;
  profile: {
    profiles: {
      [programCode: string]: {
        dlnSearch: boolean;
        deleteEnabled: boolean;
        qualityReviewEnabled: boolean;
        leadRoleEnabled: boolean;
        rejectsEnabled: boolean;
        suspendStatusCodes: string[];
      };
    };
  };
}

// Mock data for tax examiners
const mockExaminers: ComboBoxOption[] = [
  { value: 'examiner1', label: 'Sarah Thompson', seid: 'u1000' },
  { value: 'examiner2', label: 'James Wilson', seid: 'u1000' },
  { value: 'examiner3', label: 'Maria Garcia', seid: 'u1000' },
  { value: 'examiner4', label: 'Kevin Brown', seid: 'u1000' },
  { value: 'examiner5', label: 'Ashley Davis', seid: 'u1000' },
];

// Mock data for managers (proxy selection)
const mockManagers = [
  { value: 'manager1', label: 'Jennifer Smith - Team Alpha' },
  { value: 'manager2', label: 'David Johnson - Team Beta' },
  { value: 'manager3', label: 'Lisa Chen - Team Gamma' },
  { value: 'manager4', label: 'Robert Williams - Team Delta' },
];

// Mock programs data - matching userProfile.json structure
const mockPrograms: Program[] = [
  {
    id: '44720',
    name: 'Program 44720',
    roles: [
      { id: 'lead', name: 'lead', label: 'Lead' },
      { id: 'reject', name: 'reject', label: 'Reject' },
      { id: 'qr-review', name: 'qr-review', label: 'QR Review' },
      { id: 'delete', name: 'delete', label: 'Delete' },
      { id: 'dln-search', name: 'dln-search', label: 'DLN Search' },
    ],
    statusCodes: [
      { code: 'SC-1', name: 'Status Code SC-1' },
      { code: 'SC-2', name: 'Status Code SC-2' },
      { code: 'SC-3', name: 'Status Code SC-3' },
      { code: 'SC-4', name: 'Status Code SC-4' },
      { code: 'SC-5', name: 'Status Code SC-5' },
    ],
  },
  {
    id: '44730',
    name: 'Program 44730',
    roles: [
      { id: 'lead', name: 'lead', label: 'Lead' },
      { id: 'reject', name: 'reject', label: 'Reject' },
      { id: 'qr-review', name: 'qr-review', label: 'QR Review' },
      { id: 'delete', name: 'delete', label: 'Delete' },
      { id: 'dln-search', name: 'dln-search', label: 'DLN Search' },
    ],
    statusCodes: [
      { code: 'SC-1', name: 'Status Code SC-1' },
      { code: 'SC-2', name: 'Status Code SC-2' },
      { code: 'SC-3', name: 'Status Code SC-3' },
      { code: 'SC-4', name: 'Status Code SC-4' },
      { code: 'SC-5', name: 'Status Code SC-5' },
    ],
  },
];

export default function RoleAssignmentPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const userGroup = useUserGroup();
  const currentUserSeid = useSeid();
  const [selectedProxy, setSelectedProxy] = useState('');
  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerData | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Function to fetch user profile data
  const fetchUserProfile = useCallback(async (selectedSeid: string) => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch('/api/v1/era/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'SEID': selectedSeid
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const profileData: UserProfile = await response.json();
      setUserProfile(profileData);
      
      // Parse profile data and populate role assignments
      const assignments: RoleAssignment[] = [];
      const programProfiles = profileData.profile?.profiles ?? {};
      Object.entries(programProfiles).forEach(([programId, programData]) => {
        const roles: string[] = [];
        const statusCodes: string[] = [];

        if (programData.leadRoleEnabled) roles.push('lead');
        if (programData.rejectsEnabled) {
          roles.push('reject');
          statusCodes.push(...programData.suspendStatusCodes);
        }
        if (programData.qualityReviewEnabled) roles.push('qr-review');
        if (programData.deleteEnabled) roles.push('delete');
        if (programData.dlnSearch) roles.push('dln-search');

        if (roles.length > 0) {
          assignments.push({
            programId,
            roles,
            statusCodes
          });
        }
      });

      setRoleAssignments(assignments);
      
      // Update examiner data with profile information
      setSelectedExaminer(prev => prev ? {
        ...prev,
        name: profileData.userName,
        team: profileData.teamCode
      } : null);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      alert('Failed to fetch user profile. Please try again.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // All hooks must be called before any conditional returns
  const handleExaminerSelect = useCallback((option: ComboBoxOption | null) => {
    if (option) {
      // Map examiner data
      const examinerData: ExaminerData = {
        name: option.label,
        seid: option.seid,
        team: 'Team Alpha', // Default team, will be updated by API
        avatar: option.label.split(' ').map(n => n[0]).join('').toUpperCase(),
      };
      setSelectedExaminer(examinerData);
      
      // Fetch user profile data
      fetchUserProfile(option.seid);
    } else {
      setSelectedExaminer(null);
      setUserProfile(null);
      setRoleAssignments([]);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Redirect to forbidden if user is not a manager
    if (!user || userGroup !== 'managers') {
      router.replace('/forbidden');
      return;
    }
  }, [user, userGroup, isLoading, router]);

  // Debug logging
  console.log('🔍 Role Assignment Debug:', {
    user,
    userGroup,
    isLoading,
    isManager: userGroup === 'managers'
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if user is not authorized (will redirect)
  if (!user || userGroup !== 'managers') {
    return null;
  }

  const handleProxyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProxy(e.target.value);
  };

  const handleTeamChange = (newTeam: string) => {
    if (selectedExaminer) {
      setSelectedExaminer({
        ...selectedExaminer,
        team: newTeam,
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedExaminer(null);
    setRoleAssignments([]);
    setUserProfile(null);
  };

  const handleSaveAssignments = async () => {
    if (!selectedExaminer || !userProfile || !currentUserSeid) {
      alert('Please select a tax examiner first.');
      return;
    }

    if (roleAssignments.length === 0) {
      alert('Please select at least one program to assign.');
      return;
    }

    // Build confirmation message
    let message = `Assign the following roles to ${selectedExaminer.name}?\n\n`;
    roleAssignments.forEach(assignment => {
      const program = mockPrograms.find(p => p.id === assignment.programId);
      if (program) {
        message += `${program.name}: ${assignment.roles.join(', ')}`;
        if (assignment.statusCodes.length > 0) {
          message += ` (Status Codes: ${assignment.statusCodes.join(', ')})`;
        }
        message += '\n';
      }
    });

    if (!confirm(message)) {
      return;
    }

    try {
      // Build the payload in the same structure as userProfile.json
      const updatedProfile: UserProfile = {
        ...userProfile,
        teamCode: selectedExaminer.team,
        profile: {
          profiles: {}
        }
      };

      // Convert role assignments back to profile.profiles structure
      roleAssignments.forEach(assignment => {
        updatedProfile.profile.profiles[assignment.programId] = {
          dlnSearch: assignment.roles.includes('dln-search'),
          deleteEnabled: assignment.roles.includes('delete'),
          qualityReviewEnabled: assignment.roles.includes('qr-review'),
          leadRoleEnabled: assignment.roles.includes('lead'),
          rejectsEnabled: assignment.roles.includes('reject'),
          suspendStatusCodes: assignment.statusCodes
        };
      });

      const response = await fetch(`/api/v1/era/users/${userProfile.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'SEID': currentUserSeid
        },
        body: JSON.stringify(updatedProfile)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert('Role assignments saved successfully!');
      console.log('Saved assignments:', updatedProfile);
      
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Failed to save role assignments. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-2">
        <Breadcrumbs items={[
          createBreadcrumbs.home(),
          { label: 'Manage Profiles', isActive: true }
        ]} />
      </div>
      
      {/* Top Toolbar */}
      <div className="mx-4 mb-6" style={{ display: 'none' }}>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between">
          <div className="toolbar-left">
            <button
              onClick={() => router.push('/qrInventory')}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
            >
              View Inventory
            </button>
          </div>
          <div className="toolbar-center">
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
              Role Assignment
            </h2>
          </div>
          <div className="toolbar-right">
            {/* Additional toolbar items can go here */}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-[1200px] px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Panel: Search and Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-blue-800 mb-6 pb-3 border-b-2 border-gray-200">
            Tax Examiner Selection
          </h2>
          
          {/* Proxy Manager Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-semibold text-orange-800 mb-2">
              Acting as Proxy Manager?
            </label>
            <select
              value={selectedProxy}
              onChange={handleProxyChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-700 transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white focus:shadow-sm hover:border-gray-400"
            >
              <option value="">Select Manager (Optional)</option>
              {mockManagers.map((manager) => (
                <option key={manager.value} value={manager.value}>
                  {manager.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Examiner Selection */}
          <div className="form-group">
            <label className="block text-base font-semibold text-gray-900 mb-2">
              Enter SEID or Select from Team
            </label>
            <ComboBox
              options={mockExaminers}
              onSelect={handleExaminerSelect}
              placeholder="Enter SEID or select from dropdown..."
            />
          </div>
        </div>

        {/* Right Panel: Examiner Details and Role Assignment */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-blue-800 mb-6 pb-3 border-b-2 border-gray-200">
            Role Assignment
          </h2>
          
          <ExaminerCard 
            examiner={selectedExaminer} 
            onTeamChange={handleTeamChange}
          >
            {selectedExaminer && (
              <>
                {isLoadingProfile ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading user profile...</p>
                  </div>
                ) : (
                  <ProgramRoleGrid
                    programs={mockPrograms}
                    assignments={roleAssignments}
                    onAssignmentChange={setRoleAssignments}
                  />
                )}
              </>
            )}
          </ExaminerCard>

          {/* Action Buttons */}
          {selectedExaminer && (
            <div className="flex gap-4 mt-8 justify-end">
              <button
                onClick={handleClearSelection}
                disabled={isLoadingProfile}
                className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-500 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={isLoadingProfile || !userProfile}
                className="px-7 py-3 bg-blue-600 text-white border-2 border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-all duration-200 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Assignments
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
