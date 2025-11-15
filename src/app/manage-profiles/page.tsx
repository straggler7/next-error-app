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
import { SuspenseCodesService } from '../../services/suspenseCodesService';
import ErrorAlert from '../../components/ErrorAlert';

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

// Options for proxy manager select (populated from API)
interface ManagerOption {
  value: string;
  label: string;
}

// Notification interface
interface Notification {
  id: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title?: string;
  message: string;
}

// Function to create programs dynamically with status codes
const createPrograms = (statusCodes: string[] = []): Program[] => {
  const standardRoles = [
    { id: 'lead', name: 'lead', label: 'Lead' },
    { id: 'reject', name: 'reject', label: 'Reject' },
    { id: 'qr-review', name: 'qr-review', label: 'QR Review' },
    { id: 'delete', name: 'delete', label: 'Delete' },
    { id: 'dln-search', name: 'dln-search', label: 'DLN Search' },
  ];

  const formattedStatusCodes = statusCodes.map(code => ({
    code: code,
    name: `${code}`
  }));

  return [
    {
      id: '44720',
      name: 'Program 44720',
      roles: standardRoles,
      statusCodes: formattedStatusCodes,
    },
    {
      id: '44730',
      name: 'Program 44730',
      roles: standardRoles,
      statusCodes: formattedStatusCodes,
    },
  ];
};

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
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);
  const [examinerOptions, setExaminerOptions] = useState<ComboBoxOption[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(false);
  const [isLoadingExaminers, setIsLoadingExaminers] = useState(false);
  const [statusCodes, setStatusCodes] = useState<string[]>([]);
  const [isLoadingStatusCodes, setIsLoadingStatusCodes] = useState(false);
  const [programs, setPrograms] = useState<Program[]>(createPrograms());
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Helper function to add notifications
  const addNotification = useCallback((type: Notification['type'], message: string, title?: string) => {
    const id = Date.now().toString();
    const notification: Notification = { id, type, message, title };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove success and info notifications after 5 seconds
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  }, []);

  // Helper function to remove notifications
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Function to fetch user profile data for a specific SEID
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
        teamCode: profileData.teamCode
      } : null);
      
      // Show success notification
      // addNotification('info', `Profile loaded for ${profileData.userName}`, 'Profile Loaded');

    } catch (error) {
      console.error('Error fetching user profile:', error);
      addNotification('error', 'Failed to fetch user profile. Please try again.', 'Profile Load Error');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [addNotification]);

  // Fetch status codes on component mount
  useEffect(() => {
    const fetchStatusCodes = async () => {
      if (!currentUserSeid) return;
      
      setIsLoadingStatusCodes(true);
      try {
        const codes = await SuspenseCodesService.getSuspenseCodes(currentUserSeid);
        setStatusCodes(codes);
        
        // Update programs with fetched status codes
        const updatedPrograms = createPrograms(codes);
        setPrograms(updatedPrograms);
        
        // Show success notification for status codes
        if (codes.length > 0) {
          // addNotification('info', `Loaded ${codes.length} status codes successfully`, 'Status Codes Loaded');
        }
      } catch (error) {
        console.error('Error fetching status codes:', error);
        // addNotification('warning', 'Failed to load status codes. Using default configuration.', 'Status Codes Warning');
        // Fallback to empty data if fetch fails
        setStatusCodes([]);
        setPrograms(createPrograms());
      } finally {
        setIsLoadingStatusCodes(false);
      }
    };

    fetchStatusCodes();
  }, [currentUserSeid, addNotification]);

  // Fetch list of managers for proxy dropdown
  useEffect(() => {
    if (!currentUserSeid) return;

    const fetchManagers = async () => {
      setIsLoadingManagers(true);
      try {
        const response = await fetch('/api/v1/era/users/getManagers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'SEID': currentUserSeid,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const managers: UserProfile[] = await response.json();
        const options: ManagerOption[] = managers.map((manager) => ({
          value: manager.seid,
          label: `${manager.userName} - ${manager.seid}`,
        }));
        setManagerOptions(options);

        // Default selected manager to current user SEID if present and none selected yet
        if (!selectedProxy && currentUserSeid) {
          const hasCurrentManager = options.some(opt => opt.value === currentUserSeid);
          if (hasCurrentManager) {
            setSelectedProxy(currentUserSeid);
          }
        }
      } catch (error) {
        console.error('Error fetching managers:', error);
      } finally {
        setIsLoadingManagers(false);
      }
    };

    fetchManagers();
  }, [currentUserSeid, selectedProxy]);

  // Fetch team tax examiners for the active manager (current or proxy)
  useEffect(() => {
    if (!currentUserSeid) return;

    const managerSeid = selectedProxy || currentUserSeid;

    const fetchTaxExaminers = async () => {
      setIsLoadingExaminers(true);
      try {
        const response = await fetch(`/api/v1/era/users/${managerSeid}/getTaxExaminers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'SEID': currentUserSeid,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const examiners: UserProfile[] = await response.json();
        const options: ComboBoxOption[] = examiners.map((examiner) => ({
          value: examiner.seid,
          label: `${examiner.userName} - ${examiner.seid}`,
          seid: examiner.seid,
        }));
        setExaminerOptions(options);
      } catch (error) {
        console.error('Error fetching tax examiners:', error);
      } finally {
        setIsLoadingExaminers(false);
      }
    };

    fetchTaxExaminers();
  }, [currentUserSeid, selectedProxy]);

  // All hooks must be called before any conditional returns
  const handleExaminerSelect = useCallback((option: ComboBoxOption | null) => {
    if (option) {
      // Map examiner data
      const examinerData: ExaminerData = {
        name: option.label,
        seid: option.seid,
        teamCode: 'Team Alpha', // Default team, will be updated by API
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
    const newProxy = e.target.value;
    setSelectedProxy(newProxy);

    // Clear current examiner selection and assignments when switching proxy context
    setSelectedExaminer(null);
    setUserProfile(null);
    setRoleAssignments([]);
    setExaminerOptions([]);
  };

  const handleTeamChange = (newTeam: string) => {
    if (selectedExaminer) {
      setSelectedExaminer({
        ...selectedExaminer,
        teamCode: newTeam,
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
      addNotification('warning', 'Please select a tax examiner first.', 'Selection Required');
      return;
    }

    if (roleAssignments.length === 0) {
      addNotification('warning', 'Please select at least one program to assign.', 'Assignment Required');
      return;
    }

    // Build confirmation message
    let message = `Assign the following roles to ${selectedExaminer.name}?\n\n`;
    roleAssignments.forEach(assignment => {
      const program = programs.find(p => p.id === assignment.programId);
      if (program) {
        message += `${program.name}: ${assignment.roles.join(', ')}`;
        if (assignment.statusCodes.length > 0) {
          message += ` (Status Codes: ${assignment.statusCodes.join(', ')})`;
        }
        message += '\n';
      }
    });

    // if (!confirm(message)) {
    //   return;
    // }

    try {
      // Build the payload in the same structure as userProfile.json
      const updatedProfile: UserProfile = {
        ...userProfile,
        teamCode: selectedExaminer.teamCode,
        profile: {
          profiles: {}
        }
      };

      // Convert role assignments back to profile.profiles structure
      roleAssignments.forEach(assignment => {
        // Only include selected status codes (assignment.statusCodes contains only user-selected codes)
        const selectedStatusCodes = assignment.statusCodes || [];
        
        updatedProfile.profile.profiles[assignment.programId] = {
          dlnSearch: assignment.roles.includes('dln-search'),
          deleteEnabled: assignment.roles.includes('delete'),
          qualityReviewEnabled: assignment.roles.includes('qr-review'),
          leadRoleEnabled: assignment.roles.includes('lead'),
          rejectsEnabled: assignment.roles.includes('reject'),
          suspendStatusCodes: selectedStatusCodes
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

      addNotification('success', 'Role assignments have been saved successfully!', 'Save Complete');
      console.log('Saved assignments:', updatedProfile);
      
    } catch (error) {
      console.error('Error saving assignments:', error);
      addNotification('error', 'Failed to save role assignments. Please try again.', 'Save Error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1600px] px-4 pt-4 pb-2">
        <Breadcrumbs items={[
          createBreadcrumbs.home(),
          { label: 'Manage Profiles', isActive: true }
        ]} />
      </div>
      
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mx-auto max-w-[1600px] px-4 pb-4">
          <div className="space-y-3">
            {notifications.map((notification) => (
              <ErrorAlert
                key={notification.id}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => removeNotification(notification.id)}
              />
            ))}
          </div>
        </div>
      )}
      
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
      <div className="mx-auto max-w-[1600px] px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Panel: Search and Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-blue-800 mb-6 pb-3 border-b-2 border-gray-200">
            Tax Examiner Selection
          </h2>
          
          {/* Proxy Manager Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-semibold text-orange-800 mb-2">
              Manager
            </label>
            <select
              value={selectedProxy}
              onChange={handleProxyChange}
              disabled={isLoadingManagers}
              className="w-full px-4 py-3 border-2 rounded-lg text-sm transition-all duration-150 focus:outline-none focus:bg-white focus:shadow-sm
                disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
                border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400 focus:border-blue-600"
            >
              <option value="">Select Manager</option>
              {managerOptions.map((manager) => (
                <option key={manager.value} value={manager.value}>
                  {manager.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tax Examiner Selection */}
          <div className="form-group">
            <label className="block text-base font-semibold text-gray-900 mb-2">
              Tax Examiner
            </label>
            <ComboBox
              options={examinerOptions}
              onSelect={handleExaminerSelect}
              placeholder={isLoadingExaminers ? 'Loading tax examiners...' : 'Enter SEID or select from dropdown...'}
              disabled={isLoadingExaminers}
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
                {(isLoadingProfile || isLoadingStatusCodes) ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                      {isLoadingProfile ? 'Loading user profile...' : 'Loading status codes...'}
                    </p>
                  </div>
                ) : (
                  <ProgramRoleGrid
                    programs={programs}
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
                disabled={isLoadingProfile || isLoadingStatusCodes}
                className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-500 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={isLoadingProfile || isLoadingStatusCodes || !userProfile}
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
