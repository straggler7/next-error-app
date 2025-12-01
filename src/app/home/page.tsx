"use client";

// Force dynamic rendering for this page since it requires authentication
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../../contexts/AuthContext";
import { landingSearchService } from "../../services/landingSearchService";
import { useSeid } from "../../hooks/useSeid";
import { SuspenseCodesService, SuspenseCode } from "../../services/suspenseCodesService";

interface SearchFormData {
  dln: string;
  nameControl: string;
  tin: string;
  taxpayerName: string;
}

interface ProgramFormData {
  program: string;
  statusCode: string;
  serviceCenter: string;
  seid: string;
  qualityReview: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  console.log("user in home", user)
  // Helper functions to check user permissions for selected program
  const hasQualityReviewEnabled = () => {
    if (!user?.profile?.profile?.profiles) return false;
    
    // If a program is selected, check that specific program
    if (programForm.program) {
      const selectedProgramProfile = user.profile.profile.profiles[programForm.program];
      return selectedProgramProfile?.qualityReviewEnabled || false;
    }
    
    // If no program selected, show if ANY program has quality review enabled
    // return Object.values(user.profile.profile.profiles).some(profile => profile.qualityReviewEnabled);
    return false;
  };

  const hasDlnSearchEnabled = () => {
    if (!user?.profile?.profile?.profiles || !programForm.program) return false;
    
    // Only show search records if a program is selected AND that program has dlnSearch enabled
    const selectedProgramProfile = user.profile.profile.profiles[programForm.program];
    return selectedProgramProfile?.dlnSearch || false;
  };
  
  // Search form state
  const [searchForm, setSearchForm] = useState<SearchFormData>({
    dln: "",
    nameControl: "",
    tin: "",
    taxpayerName: ""
  });
  
  // Program selection form state
  const [programForm, setProgramForm] = useState<ProgramFormData>({
    program: "",
    statusCode: "",
    serviceCenter: "andover",
    seid: "",
    qualityReview: false
  });
  
  // UI state
  const [searchError, setSearchError] = useState("");
  const [programStatusError, setProgramStatusError] = useState("");
  const [serviceCenterError, setServiceCenterError] = useState("");
  const [isSearchButtonEnabled, setIsSearchButtonEnabled] = useState(false);
  const [isSubmitButtonEnabled, setIsSubmitButtonEnabled] = useState(false);
  const [statusCodes, setStatusCodes] = useState<SuspenseCode[]>([]);
  const [loadingStatusCodes, setLoadingStatusCodes] = useState(false);

  const currentUserSeid = useSeid();

  // Validation functions
  const validateDLN = (dln: string): boolean => {
    const cleanDLN = dln.replace(/\D/g, '');
    return cleanDLN.length === 17 && /^\d{17}$/.test(cleanDLN);
  };

  const validateTIN = (tin: string): boolean => {
    const cleanTIN = tin.replace(/\D/g, '');
    return /^\d{9}$/.test(cleanTIN);
  };

  // Formatting functions
  const formatDLN = (value: string): string => {
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length > 17) {
      cleanValue = cleanValue.substring(0, 17);
    }
    return cleanValue;
  };

  const formatTIN = (value: string): string => {
    let cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 9) {
      // Format as SSN: XXX-XX-XXXX
      if (cleanValue.length >= 6) {
        cleanValue = cleanValue.replace(/(\d{3})(\d{2})(\d{0,4})/, '$1-$2-$3');
      } else if (cleanValue.length >= 4) {
        cleanValue = cleanValue.replace(/(\d{3})(\d{0,2})/, '$1-$2');
      }
    } else {
      // Format as EIN: XX-XXXXXXX
      cleanValue = cleanValue.substring(0, 9);
      cleanValue = cleanValue.replace(/(\d{2})(\d{0,7})/, '$1-$2');
    }
    return cleanValue;
  };

  const formatNameControl = (value: string): string => {
    return value.toUpperCase().substring(0, 4);
  };

  // Effect to toggle search button
  useEffect(() => {
    const hasValue = Object.values(searchForm).some(value => value.trim() !== '');
    setIsSearchButtonEnabled(hasValue);
  }, [searchForm]);

  // Effect to validate program form
  useEffect(() => {
    const hasProgram = programForm.program;
    const hasServiceCenter = programForm.serviceCenter;
    
    // setProgramStatusError(hasProgram ? "" : "Please select a program or status code.");
    // setServiceCenterError(hasServiceCenter ? "" : "Please select a service center.");
    
    setIsSubmitButtonEnabled(Boolean(hasProgram && hasServiceCenter));
  }, [programForm]);

  // Fetch status codes on component mount
  useEffect(() => {
    const fetchStatusCodes = async () => {
      if (!currentUserSeid) return;
      
      setLoadingStatusCodes(true);
      try {
        const codesWithDetails = await SuspenseCodesService.getSuspenseCodesWithDetails(currentUserSeid);
        setStatusCodes(codesWithDetails);
      } catch (error) {
        console.error('Error fetching status codes:', error);
        // Fallback to empty array if fetch fails
        setStatusCodes([]);
      } finally {
        setLoadingStatusCodes(false);
      }
    };

    fetchStatusCodes();
  }, [currentUserSeid]);

  // Handle search form input changes
  const handleSearchInputChange = (field: keyof SearchFormData, value: string) => {
    let formattedValue = value;
    
    switch (field) {
      case 'dln':
        formattedValue = formatDLN(value);
        break;
      case 'nameControl':
        formattedValue = formatNameControl(value);
        break;
      case 'tin':
        formattedValue = formatTIN(value);
        break;
      case 'taxpayerName':
        formattedValue = value.substring(0, 50);
        break;
    }
    
    setSearchForm(prev => ({ ...prev, [field]: formattedValue }));
    setSearchError("");
  };

  // Handle program form input changes
  const handleProgramInputChange = (field: keyof ProgramFormData, value: string) => {
    setProgramForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle search form submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setSearchError("");
    
    // Check if at least one field is filled
    const hasValue = Object.values(searchForm).some(value => value.trim() !== '');
    if (!hasValue) {
      setSearchError("Please enter at least one search criteria.");
      return;
    }
    
    // Validate DLN if provided
    if (searchForm.dln && !validateDLN(searchForm.dln)) {
      setSearchError("DLN must be exactly 17 digits.");
      return;
    }
    
    // Validate TIN if provided
    if (searchForm.tin && !validateTIN(searchForm.tin.replace(/\D/g, ''))) {
      setSearchError("Please enter a valid TIN format (SSN: XXX-XX-XXXX or EIN: XX-XXXXXXX).");
      return;
    }
    
    // Validate Name Control length if provided
    if (searchForm.nameControl && searchForm.nameControl.length > 4) {
      setSearchError("Name Control must be 4 characters or less.");
      return;
    }
    
    try {
      // Perform search using the service
      const searchResult = await landingSearchService.searchRecords({
        dln: searchForm.dln ? searchForm.dln.replace(/\D/g, '') : '',
        nameControl: searchForm.nameControl.toUpperCase(),
        tin: searchForm.tin.replace(/\D/g, ''),
        taxpayerName: searchForm.taxpayerName
      });
      
      if (searchResult.success) {
        // Navigate to form4868-ers page with search results
        router.push('/form4868-ers');
      } else {
        setSearchError(searchResult.message || "Search failed. Please try again.");
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError("An error occurred during search. Please try again.");
    }
  };

  // Handle program form submission
  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSubmitButtonEnabled) return;

    console.log('programForm.qualityReview:', programForm.qualityReview);
    console.log('programForm:', programForm);
    
    if (hasQualityReviewEnabled() && programForm.qualityReview) {
      const selectionData = {
        program: programForm.program,
        statusCode: programForm.statusCode,
        serviceCenter: programForm.serviceCenter,
        seid: programForm.seid
      };
      
      console.log('Storing selectionData:', selectionData);
      sessionStorage.setItem('selectionData', JSON.stringify(selectionData));
      
      // Verify it was stored
      const stored = sessionStorage.getItem('selectionData');
      console.log('Stored data verification:', stored);

      router.push('/qrInventory');
      return;
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'SERVICE_CENTER': programForm.serviceCenter.toUpperCase(),
      'PROGRAM_CODE': programForm.program || programForm.statusCode,
      'SEID': `${currentUserSeid}`
    }

    if (programForm.statusCode) {
      headers['SUSPEND_STATUS_CODE'] = programForm.statusCode;
    }

    try {
      // Make GET request to auto-assign endpoint with headers
      const response = await fetch('/api/v1/era/inventories/auto-assign', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const eraDto = await response.json();
        
        // Store the ERA DTO data for the workRecord page
        sessionStorage.setItem('eraDto', JSON.stringify(eraDto));
        sessionStorage.setItem('selectionData', JSON.stringify({
          program: programForm.program,
          statusCode: programForm.statusCode,
          serviceCenter: programForm.serviceCenter,
          seid: programForm.seid
        }));

        router.push('/workRecord');
        
        // Navigate to QR Inventory if quality review is selected, otherwise workRecord
        // if (programForm.qualityReview) {
        // //   router.push(`/qrInventory${programForm.seid ? `?seid=${programForm.seid}` : ''}`);
        //   router.push(`/qrInventory`);
        // } else {
        //   router.push('/workRecord');
        // }
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        setProgramStatusError(`Error: ${error.message}`);
        console.error('Work record assignment error:', errorText);
      }
    } catch (error) {
      console.error('Program selection error:', error);
      setProgramStatusError("An error occurred while getting work assignment. Please try again.");
    }
  };

  // Show loading state
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

  // Show error if not authenticated (shouldn't happen due to middleware)
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Authentication required. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <DevBanner /> */}
      <Header />
      
      <div className="main-container flex flex-col p-4">
        <div className="content-layout flex flex-col items-center gap-2">
          
          {/* Welcome Section */}
          <div className="welcome-section text-center mb-2 w-full max-w-6xl">
            <h1 className="welcome-title text-2xl font-semibold text-[#003d6b] mb-2">
              Welcome to ERA
            </h1>
            <p className="welcome-subtitle text-base text-gray-500 mb-4 leading-relaxed hidden">
              Search by DLN, Name Control, TIN, or Taxpayer Name, or select your program/status code and service center to begin error resolution processing.
            </p>
          </div>

          {/* Error Alerts Section */}
          <div className="error-alerts-section w-full max-w-6xl">
            {searchError && (
              <ErrorAlert 
                type="error"
                message={searchError}
                onClose={() => setSearchError("")}
                className="mb-4"
              />
            )}
            {programStatusError && (
              <ErrorAlert 
                type="error"
                message={programStatusError}
                onClose={() => setProgramStatusError("")}
                className="mb-4"
              />
            )}
            {serviceCenterError && (
              <ErrorAlert 
                type="error"
                message={serviceCenterError}
                onClose={() => setServiceCenterError("")}
                className="mb-4"
              />
            )}
          </div>

          {/* Two-Card Layout */}
          <div className={`cards-container grid grid-cols-1 gap-4 w-full max-w-6xl ${
            hasDlnSearchEnabled() ? 'lg:grid-cols-2' : 'lg:grid-cols-1 lg:max-w-2xl lg:mx-auto'
          }`}>
            
            {/* Left Card: Program & Status Code Selection */}
            <div className="card bg-white rounded-xl p-8 border" style={{ 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              borderColor: '#f1f3f4' 
            }}>
              <h2 className="card-title text-xl font-semibold text-[#003d6b] mb-6 pb-3" style={{ borderBottom: '2px solid #e9ecef' }}>
                Program & Status Code Selection
              </h2>
              
              <form className="selection-form flex flex-col gap-4" onSubmit={handleProgramSubmit}>
                {/* 1. Program Selection */}
                <div className="form-group">
                  <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="programSelect">
                    Program Selection <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400 cursor-pointer" 
                    style={{
                      padding: '0.875rem 1.125rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      lineHeight: '1.4',
                      background: '#fafafa',
                      color: '#374151'
                    }}
                    id="programSelect" 
                    name="program"
                    required
                    value={programForm.program}
                    onChange={(e) => handleProgramInputChange('program', e.target.value)}
                  >
                    <option value="">Select a program...</option>
                    <option value="44720">44720</option>
                    <option value="44730">44730</option>
                  </select>
                </div>

                {/* 2. Service Center */}
                <div className="form-group">
                  <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="serviceCenterSelect">
                    Service Center <span className="text-red-500">*</span>
                  </label>
                  <select 
                    className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400 cursor-pointer" 
                    style={{
                      padding: '0.875rem 1.125rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      lineHeight: '1.4',
                      background: '#fafafa',
                      color: '#374151'
                    }}
                    id="serviceCenterSelect" 
                    name="serviceCenter" 
                    required
                    value={programForm.serviceCenter}
                    onChange={(e) => handleProgramInputChange('serviceCenter', e.target.value)}
                  >
                    <option value="">Select a service center...</option>
                    <option value="andover">Andover</option>
                    <option value="austin">Austin</option>
                    <option value="ogden">Ogden</option>
                    <option value="fresno">Fresno</option>
                    <option value="kansas-city">Kansas City</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="statusCodeSelect">
                    Status Code
                  </label>
                  <select 
                    className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400 cursor-pointer" 
                    style={{
                      padding: '0.875rem 1.125rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      lineHeight: '1.4',
                      background: '#fafafa',
                      color: '#374151'
                    }}
                    id="statusCodeSelect" 
                    name="statusCode" 
                    value={programForm.statusCode}
                    onChange={(e) => handleProgramInputChange('statusCode', e.target.value)}
                  >
                    <option value="">Select a status code (optional)</option>
                    {loadingStatusCodes ? (
                      <option disabled>Loading status codes...</option>
                    ) : (
                      statusCodes.map((statusCode) => (
                        <option key={statusCode.code} value={statusCode.code}>
                          {statusCode.code} - {statusCode.description}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* 3. Work on Quality Review Checkbox - Only show if user has qualityReviewEnabled */}
                {hasQualityReviewEnabled() && (
                  <div className="checkbox-container flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="qualityReviewCheckbox" 
                      className="w-5 h-5 accent-blue-600"
                      checked={programForm.qualityReview}
                      onChange={(e) => setProgramForm(prev => ({ ...prev, qualityReview: e.target.checked }))}
                    />
                    <label className="checkbox-label font-semibold text-gray-800 text-sm cursor-pointer" htmlFor="qualityReviewCheckbox">
                      Work on Quality Review
                    </label>
                  </div>
                )}

                {/* 4. SEID Field - Only show if user has qualityReviewEnabled and quality review is checked */}
                {hasQualityReviewEnabled() && programForm.qualityReview && (
                  <div className="form-group">
                    <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="seidInput">
                      SEID
                    </label>
                    <input 
                      type="text" 
                      className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400"
                      style={{
                        padding: '0.875rem 1.125rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        background: '#fafafa',
                        color: '#374151'
                      }}
                      id="seidInput" 
                      name="seid" 
                      placeholder="Enter SEID"
                      maxLength={20}
                      value={programForm.seid}
                      onChange={(e) => handleProgramInputChange('seid', e.target.value)}
                    />
                  </div>
                )}


                <div className="action-section flex justify-center">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-64 mt-2 font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #0066cc',
                      borderRadius: '8px',
                      backgroundColor: isSubmitButtonEnabled ? '#0066cc' : '#9ca3af',
                      borderColor: isSubmitButtonEnabled ? '#0066cc' : '#9ca3af',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      minWidth: '180px',
                    }}
                    onMouseEnter={(e) => {
                      if (isSubmitButtonEnabled) {
                        e.currentTarget.style.backgroundColor = '#0052a3';
                        e.currentTarget.style.borderColor = '#0052a3';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 102, 204, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isSubmitButtonEnabled) {
                        e.currentTarget.style.backgroundColor = '#0066cc';
                        e.currentTarget.style.borderColor = '#0066cc';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                    disabled={!isSubmitButtonEnabled}
                  >
                    {hasQualityReviewEnabled() && programForm.qualityReview ? 'Continue to QR' : 'Continue to Details'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Card: Search Records - Only show if user has dlnSearch enabled */}
            {hasDlnSearchEnabled() && (
              <div className="card bg-white rounded-xl p-8 border" style={{ 
                borderRadius: '12px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
                borderColor: '#f1f3f4' 
              }}>
              <h2 className="card-title text-xl font-semibold text-[#003d6b] mb-6 pb-3" style={{ borderBottom: '2px solid #e9ecef' }}>
                Search Records
              </h2>
              
              <div className="search-section w-full">
                <form className="search-form w-full flex flex-col gap-4" onSubmit={handleSearchSubmit}>
                  <div className="search-fields-grid flex flex-col gap-4 w-full">
                    <div className="form-group">
                      <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="dlnInput">
                        DLN Number
                      </label>
                      <input
                        type="text"
                        className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400"
                        style={{
                          padding: '0.875rem 1.125rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          background: '#fafafa',
                          color: '#374151'
                        }}
                        id="dlnInput"
                        name="dln"
                        placeholder="Enter 17-digit DLN"
                        maxLength={20}
                        value={searchForm.dln}
                        onChange={(e) => handleSearchInputChange('dln', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="nameControlInput">
                        Name Control
                      </label>
                      <input
                        type="text"
                        className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400"
                        style={{
                          padding: '0.875rem 1.125rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          background: '#fafafa',
                          color: '#374151'
                        }}
                        id="nameControlInput"
                        name="nameControl"
                        placeholder="Enter name control"
                        maxLength={4}
                        value={searchForm.nameControl}
                        onChange={(e) => handleSearchInputChange('nameControl', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="tinInput">
                        TIN
                      </label>
                      <input
                        type="text"
                        className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400"
                        style={{
                          padding: '0.875rem 1.125rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          background: '#fafafa',
                          color: '#374151'
                        }}
                        id="tinInput"
                        name="tin"
                        placeholder="Enter TIN (SSN/EIN)"
                        maxLength={11}
                        value={searchForm.tin}
                        onChange={(e) => handleSearchInputChange('tin', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label block text-sm font-semibold text-gray-800 mb-2" htmlFor="taxpayerNameInput">
                        Taxpayer Name
                      </label>
                      <input
                        type="text"
                        className="w-full transition-all duration-150 focus:outline-none focus:border-blue-600 focus:bg-white hover:border-gray-400"
                        style={{
                          padding: '0.875rem 1.125rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          lineHeight: '1.4',
                          background: '#fafafa',
                          color: '#374151'
                        }}
                        id="taxpayerNameInput"
                        name="taxpayerName"
                        placeholder="Enter taxpayer name"
                        maxLength={50}
                        value={searchForm.taxpayerName}
                        onChange={(e) => handleSearchInputChange('taxpayerName', e.target.value)}
                      />
                    </div>
                    <div className="search-input-group flex justify-center">
                      <button
                        type="submit"
                        className="btn btn-primary search-btn w-64 mt-2 font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                        style={{
                          padding: '0.75rem 1.5rem',
                          border: '1px solid #0066cc',
                          borderRadius: '8px',
                          backgroundColor: isSearchButtonEnabled ? '#0066cc' : '#9ca3af',
                          borderColor: isSearchButtonEnabled ? '#0066cc' : '#9ca3af',
                          color: 'white',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          minWidth: '120px'
                        }}
                        onMouseEnter={(e) => {
                          if (isSearchButtonEnabled) {
                            e.currentTarget.style.backgroundColor = '#0052a3';
                            e.currentTarget.style.borderColor = '#0052a3';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 102, 204, 0.2)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isSearchButtonEnabled) {
                            e.currentTarget.style.backgroundColor = '#0066cc';
                            e.currentTarget.style.borderColor = '#0066cc';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                        disabled={!isSearchButtonEnabled}
                      >
                        Search Records
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
