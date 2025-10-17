"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { mockUser } from "../../data/mockData";
import { landingSearchService } from "../../services/landingSearchService";

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
}

export default function LandingPage() {
  const router = useRouter();
  
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
    serviceCenter: "austin"
  });
  
  // UI state
  const [searchError, setSearchError] = useState("");
  const [programStatusError, setProgramStatusError] = useState("");
  const [serviceCenterError, setServiceCenterError] = useState("");
  const [isSearchButtonEnabled, setIsSearchButtonEnabled] = useState(false);
  const [isSubmitButtonEnabled, setIsSubmitButtonEnabled] = useState(false);

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
    const hasProgram = programForm.program || programForm.statusCode;
    const hasServiceCenter = programForm.serviceCenter;
    
    setProgramStatusError(hasProgram ? "" : "Please select a program or status code.");
    setServiceCenterError(hasServiceCenter ? "" : "Please select a service center.");
    
    setIsSubmitButtonEnabled(Boolean(hasProgram && hasServiceCenter));
  }, [programForm]);

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
    
    try {
      // Store selections and navigate to form4868-ers
      const selectionResult = await landingSearchService.selectProgramAndServiceCenter({
        program: programForm.program,
        statusCode: programForm.statusCode,
        serviceCenter: programForm.serviceCenter
      });
      
      if (selectionResult.success) {
        // Navigate to form4868-ers page
        router.push('/form4868-ers');
      } else {
        setProgramStatusError(selectionResult.message || "Selection failed. Please try again.");
      }
    } catch (error) {
      console.error('Program selection error:', error);
      setProgramStatusError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={mockUser} />
      
      <div className="main-container flex flex-col p-4">
        <div className="content-layout flex flex-col items-center gap-3">
          <div className="main-content bg-white rounded-xl shadow-lg p-5 flex flex-col items-center justify-start w-full max-w-4xl overflow-visible">
            <div className="content-wrapper w-full flex flex-col items-center gap-0">
              
              {/* Welcome Section */}
              <div className="welcome-section text-center mb-4 w-full">
                <h1 className="welcome-title text-3xl font-semibold text-[#003d6b] mb-2">
                  Welcome to ERA
                </h1>
                <p className="welcome-subtitle text-base text-gray-500 mb-4 leading-relaxed hidden">
                  Search by DLN, Name Control, TIN, or Taxpayer Name, or select your program/status code and service center to begin error resolution processing.
                </p>
              </div>

              {/* Enhanced Search Section */}
              <div className="search-section w-full max-w-3xl mb-3">
                <form className="dln-search-form w-full flex flex-col gap-3" onSubmit={handleSearchSubmit}>
                  <div className="form-group">
                    <div className="search-fields-grid grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-6">
                      <div className="form-group">
                        <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="dlnInput">
                          DLN Number
                        </label>
                        <input
                          type="text"
                          className="form-input w-full px-4 py-3.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300"
                          id="dlnInput"
                          name="dln"
                          placeholder="Enter 17-digit DLN"
                          maxLength={20}
                          value={searchForm.dln}
                          onChange={(e) => handleSearchInputChange('dln', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="nameControlInput">
                          Name Control
                        </label>
                        <input
                          type="text"
                          className="form-input w-full px-4 py-3.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300"
                          id="nameControlInput"
                          name="nameControl"
                          placeholder="Enter name control"
                          maxLength={4}
                          value={searchForm.nameControl}
                          onChange={(e) => handleSearchInputChange('nameControl', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="tinInput">
                          TIN
                        </label>
                        <input
                          type="text"
                          className="form-input w-full px-4 py-3.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300"
                          id="tinInput"
                          name="tin"
                          placeholder="Enter TIN (SSN/EIN)"
                          maxLength={11}
                          value={searchForm.tin}
                          onChange={(e) => handleSearchInputChange('tin', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="taxpayerNameInput">
                          Taxpayer Name
                        </label>
                        <input
                          type="text"
                          className="form-input w-full px-4 py-3.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300"
                          id="taxpayerNameInput"
                          name="taxpayerName"
                          placeholder="Enter taxpayer name"
                          maxLength={50}
                          value={searchForm.taxpayerName}
                          onChange={(e) => handleSearchInputChange('taxpayerName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="search-input-group flex gap-3 items-stretch w-full justify-center">
                      <button
                        type="submit"
                        className={`btn btn-primary search-btn px-7 py-3.5 rounded-lg font-semibold transition-all duration-200 min-w-[180px] ${
                          isSearchButtonEnabled
                            ? 'bg-[#0066cc] text-white hover:bg-[#0052a3] hover:shadow-lg'
                            : 'bg-gray-400 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!isSearchButtonEnabled}
                      >
                        Search Records
                      </button>
                    </div>
                    {searchError && (
                      <div className="error-message text-red-600 text-sm mt-2 font-medium">
                        {searchError}
                      </div>
                    )}
                  </div>
                </form>
              </div>

              {/* Section Divider */}
              <div className="section-divider flex items-center justify-center w-full my-6 relative">
                <span className="divider-text bg-white px-4 text-sm text-gray-500 relative z-10">
                  select program code or status code
                </span>
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>

              {/* Program Selection Form */}
              <form className="selection-form w-full max-w-2xl" onSubmit={handleProgramSubmit}>
                <div className="form-row flex flex-col md:flex-row gap-6 mb-4">
                  <div className="form-group flex-1">
                    <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="programSelect">
                      Program Selection
                    </label>
                    <select
                      className="form-select w-full px-4 py-3.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300 cursor-pointer"
                      id="programSelect"
                      name="program"
                      value={programForm.program}
                      onChange={(e) => handleProgramInputChange('program', e.target.value)}
                    >
                      <option value="">Select a program...</option>
                      <option value="44720">44720</option>
                      <option value="44730">44730</option>
                    </select>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="statusCodeSelect">
                      Status Code
                    </label>
                    <select
                      className="form-select w-full px-4 py-3.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300 cursor-pointer"
                      id="statusCodeSelect"
                      name="statusCode"
                      value={programForm.statusCode}
                      onChange={(e) => handleProgramInputChange('statusCode', e.target.value)}
                    >
                      <option value="">Select a status code...</option>
                      <option value="224">Status Code 224</option>
                      <option value="225">Status Code 225</option>
                      <option value="226">Status Code 226</option>
                    </select>
                  </div>
                </div>
                
                {programStatusError && (
                  <div className="error-message text-red-600 text-sm mb-4 font-medium">
                    {programStatusError}
                  </div>
                )}

                <div className="form-group mb-6">
                  <label className="form-label block text-base font-semibold text-gray-800 mb-2" htmlFor="serviceCenterSelect">
                    Service Center
                  </label>
                  <select
                    className="form-select w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-150 text-gray-700 hover:border-gray-300 cursor-pointer"
                    id="serviceCenterSelect"
                    name="serviceCenter"
                    required
                    value={programForm.serviceCenter}
                    onChange={(e) => handleProgramInputChange('serviceCenter', e.target.value)}
                  >
                    <option value="">Select a service center...</option>
                    <option value="austin">Austin (Default)</option>
                    <option value="ogden">Ogden</option>
                    <option value="charlotte">Charlotte</option>
                  </select>
                  {serviceCenterError && (
                    <div className="error-message text-red-600 text-sm mt-1 font-medium">
                      {serviceCenterError}
                    </div>
                  )}
                </div>

                <div className="action-section flex justify-center">
                  <button
                    type="submit"
                    className={`btn btn-primary px-8 py-3.5 rounded-lg font-semibold transition-all duration-200 min-w-[180px] ${
                      isSubmitButtonEnabled
                        ? 'bg-[#0066cc] text-white hover:bg-[#0052a3] hover:shadow-lg'
                        : 'bg-gray-400 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isSubmitButtonEnabled}
                  >
                    Continue to Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
