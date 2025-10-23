"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import ErrorSidebar from "../../components/ErrorSidebar";
import FormSection, { FormField, FormInput } from "../../components/FormSection";
import NotesSection from "../../components/NotesSection";
import { mockUser } from "../../data/mockData";
import { ErrorItem, Note } from "../../types";
import { workAssignmentService, FormElement, GMFError, AssignedWork, WorkRecord, AssignedWorkResponse } from "../../services/workAssignmentService";
import { landingSearchService } from "../../services/landingSearchService";
import ersDto from "../../data/ersDto.json";

// Helper to prettify labels from keys like "primarySSN" -> "Primary SSN"
const toLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

export default function Form4868ERSPage() {
  const router = useRouter();
  const [assignedWork, setAssignedWork] = useState<AssignedWork | null>(null);
  const [jsonWorkRecord, setJsonWorkRecord] = useState<any>(null);
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [originalFormElements, setOriginalFormElements] = useState<FormElement[]>([]);
  const [landingSearchData, setLandingSearchData] = useState<any>(null);
  const [landingSelectionData, setLandingSelectionData] = useState<any>(null);

  // Convert JSON work record to form elements based on editableFields
  const convertJsonWorkRecordToFormElements = (jsonRecord: any): FormElement[] => {
    if (!jsonRecord?.workRecord?.editableFields) return [];
    
    const editableFields = jsonRecord.workRecord.editableFields;
    const workRecord = jsonRecord.workRecord;
    
    return Object.keys(editableFields).map((fieldKey, index) => ({
      id: fieldKey,
      name: fieldKey,
      label: toLabel(fieldKey),
      value: workRecord[fieldKey] || '',
      type: 'text',
      ERSEditable: true,
      xpath: editableFields[fieldKey]
    }));
  };
  const [loading, setLoading] = useState(true);
  const [noWorkAvailable, setNoWorkAvailable] = useState(false);
  const [noWorkMessage, setNoWorkMessage] = useState<string>('');
  
  const ersWorkRecord = ersDto?.workRecord ?? {} as any;

  // Convert ERS reason codes to ErrorItem format for sidebar
  const convertErsErrorsToErrorItems = (): ErrorItem[] => {
    if (!jsonWorkRecord?.workRecord) return [];
    
    const workRecord = jsonWorkRecord.workRecord;
    const ersReasonCds = workRecord.ersReasonCds || [];
    const errReasonCdsMap = workRecord.errReasonCdsMap || {};
    
    return ersReasonCds.map((code: string, index: number) => ({
      id: `ers-error-${index}`,
      code: code,
      description: errReasonCdsMap[`ERR-${code}-CODE`] || `Error code: ${code}`,
      type: 'Error' as const,
      status: 'active' as const,
      errorFields: [],
      irm: {
        title: `IRM 3.12.${180 + index} - Error Resolution`,
        content: `Resolve the following error: ${errReasonCdsMap[`ERR-${code}-CODE`] || `Error code: ${code}`}`,
        steps: [
          'Review the error description',
          'Correct the identified issue in the highlighted fields',
          'Validate the correction'
        ]
      }
    }));
  };

  // Editable fields list from ersDto or formElements
  const editableFieldKeys: string[] = useMemo(() => {
    if (formElements.length > 0) {
      // Use actual form elements from API
      return formElements.filter(el => el.ERSEditable).map(el => el.name);
    }
    // Fallback to ersDto
    const ef = ersWorkRecord?.editableFields || {};
    const keys = Object.keys(ef);
    // Ensure TaxPeriodEndDt is present as required
    if (!keys.includes("TaxPeriodEndDt")) keys.unshift("TaxPeriodEndDt");
    return keys;
  }, [formElements, ersWorkRecord]);

  // Map DTO keys to actual WorkRecord property names (handle typos/mismatches)
  const dtoToRecordKey: Record<string, string> = {
    TaxPeriodEndDt: ("taxPeriodEndDt" in ersWorkRecord)
      ? "taxPeriodEndDt"
      : ("TaxPeriodEndDt" in ersWorkRecord ? "TaxPeriodEndDt" : "taxPeriodEndDt"),
    primaryNameControlTxt: "primaryNameControlTxt",
    nameLine1Txt: "nameLine1Txt",
    primarySSN: "primarySSN",
  };

  // Build initial values and original snapshot
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const key of editableFieldKeys) {
      if (formElements.length > 0) {
        // Use actual form elements from API
        const element = workAssignmentService.getFormElementByName(formElements, key);
        values[key] = element?.value || "";
      } else {
        // Fallback to ersDto
        const recordKey = dtoToRecordKey[key] || key;
        const v = (ersWorkRecord as any)?.[recordKey];
        values[key] = v ?? "";
      }
    }
    return values;
  }, [editableFieldKeys, formElements, ersWorkRecord]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user came from landing page
    const searchData = landingSearchService.getStoredSearchData();
    const selectionData = landingSearchService.getStoredSelectionData();
    const searchType = landingSearchService.getSearchType();
    
    if (searchData) {
      setLandingSearchData(searchData);
      console.log('Landing page search data found:', searchData);
    }
    
    if (selectionData) {
      setLandingSelectionData(selectionData);
      console.log('Landing page selection data found:', selectionData);
    }
    
    // Load assigned work (this will now consider landing page data)
    loadAssignedWork();
  }, []);

  useEffect(() => {
    setValues(initialValues);
    setOriginalValues(initialValues);
  }, [initialValues]);

  const loadAssignedWork = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    try {
      // Step 1: Get assigned work
      const workResponse = await workAssignmentService.getAssignedWork();
      
      if (!workResponse.hasWork) {
        setNoWorkAvailable(true);
        setNoWorkMessage(workResponse.message || 'No work records available to assign at this time.');
        // Clear existing work data when no work is available
        setAssignedWork(null);
        setJsonWorkRecord(null);
        setFormElements([]);
        return;
      }
      
      console.log('Setting new assigned work:', workResponse.work!.payloadId);
      setAssignedWork(workResponse.work!);
      setNoWorkAvailable(false);
      
      // Step 2: Get work record using payloadId
      const record = await workAssignmentService.getJsonWorkRecord(workResponse.work!.payloadId);
      console.log('Setting new work record and form elements from json');
      console.log(record);
      setJsonWorkRecord(record);
      const elements = convertJsonWorkRecordToFormElements(record);
      console.log('Converted form elements:', elements);
      setFormElements(elements);
      setOriginalFormElements([...elements]);
    } catch (error) {
      console.error('Error loading assigned work:', error);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  };

  const getDLN = () => jsonWorkRecord?.workRecord?.dln || ersWorkRecord?.dln || "N/A";

  const handleInputChange = (fieldKey: string, val: string) => {
    if (formElements.length > 0) {
      // Update form elements if using API data
      setFormElements(prev => {
        return workAssignmentService.updateFormElementValue(prev, fieldKey, val);
      });
    } else {
      // Update local values if using ersDto fallback
      setValues((prev) => ({ ...prev, [fieldKey]: val }));
    }
  };

  const clearFieldHighlight = () => {
    setHighlightedFields([]);
    setSelectedErrorId(null);
  };

  const handleErrorClick = (error: ErrorItem) => {
    if (selectedErrorId === error.id) {
      setHighlightedFields([]);
      setSelectedErrorId(null);
    } else {
      setHighlightedFields(error.errorFields || []);
      setSelectedErrorId(error.id);
    }
  };

  // Helper function to get form element value by name
  const getFormElementValue = (name: string): string => {
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(formElements, name);
      return element?.value || '';
    }
    return values[name] || '';
  };

  // Helper function to get original value
  const getOriginalValue = (name: string): string => {
    if (originalFormElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(originalFormElements, name);
      return element?.value || '';
    }
    return originalValues[name] || '';
  };

  const mockNotes: Note[] = [];

  // Get error items
  const errorItems = convertErsErrorsToErrorItems();

  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);

  const handleSubmit = async () => {
    if (!assignedWork) {
      // Fallback behavior when no assigned work
      setHighlightedFields([]);
      setSubmitting(true);
      try {
        setFlashMessage("Form submitted successfully");
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Clear any highlighted fields on submit
    setHighlightedFields([]);
    
    setSubmitting(true);
    try {
      const result = await workAssignmentService.updateWorkRecord(
        assignedWork.processId, 
        formElements
      );
      
      if (result.success) {
        // Show initial success message
        setFlashMessage('Form submitted successfully');
        setShowFlash(true);
        
        // Fetch new assigned work after successful submission
        try {
          console.log('Before loadAssignedWork - Current assignedWork:', assignedWork?.payloadId);
          await loadAssignedWork(false); // Skip loading state to avoid UI blocking
          console.log('After loadAssignedWork completed');
          setFlashMessage('Form submitted successfully and new record retrieved');
        } catch (fetchError) {
          console.error('Error fetching new assigned work:', fetchError);
          setFlashMessage('Form submitted successfully but failed to fetch new record');
        }
        
        // Hide flash message after 4 seconds (longer to show the full message)
        setTimeout(() => {
          setShowFlash(false);
        }, 4000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setFlashMessage('Error submitting form. Please try again.');
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={mockUser} showBackButton backHref="/home" />
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading assigned work...</p>
        </div>
      </div>
    );
  }

  if (noWorkAvailable) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header user={mockUser} showBackButton backHref="/home" />
        <div className="p-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">No Work Records Available</h1>
            <p className="text-gray-600">{noWorkMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={mockUser} showBackButton backHref="/home" />

      {showFlash && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <span>{flashMessage}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mx-4 mt-4 mb-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="info-badge inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
              DLN: {getDLN()}
            </span>
            {landingSearchData && (
              <span className="info-badge inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200">
                Search: {landingSearchData.dln || landingSearchData.nameControl || landingSearchData.tin || landingSearchData.taxpayerName || 'Multiple criteria'}
              </span>
            )}
            {landingSelectionData && (
              <span className="info-badge inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                {landingSelectionData.program && `Program: ${landingSelectionData.program}`}
                {landingSelectionData.statusCode && `Status: ${landingSelectionData.statusCode}`}
                {landingSelectionData.serviceCenter && ` | ${landingSelectionData.serviceCenter.toUpperCase()}`}
              </span>
            )}
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f507e] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm">
            View RRD Data
          </button>
        </div>
        {console.log(jsonWorkRecord)}
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[25%_75%] gap-4 px-4 pb-4">
        {/* Left Sidebar */}
        <div className="flex flex-col gap-4">
          <ErrorSidebar errors={errorItems} onErrorSelect={handleErrorClick} selectedErrorId={selectedErrorId} />
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Notes</h3>
            <NotesSection notes={mockNotes} onAddNote={(content) => console.log("Add note:", content)} />
          </div>
        </div>
        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col" style={{ height: "fit-content" }}>
          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              <FormSection 
                title="Form 4868 - Application for Automatic Extension"
                metadata={{
                  receivedDate: jsonWorkRecord?.workRecord?.transDt ? new Date(jsonWorkRecord.workRecord.transDt).toLocaleDateString() : (ersWorkRecord?.transDt ? new Date(ersWorkRecord.transDt).toLocaleDateString() : undefined),
                  taxPeriod: ersWorkRecord?.taxPrd,
                }}
              >
                <div className="space-y-8 px-1">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Editable Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
                      {editableFieldKeys.map((key) => (
                        <FormField
                          key={key}
                          label={key === "TaxPeriodEndDt" ? "Tax Period End Date" : toLabel(key)}
                          originalValue={getOriginalValue(key)}
                          currentValue={getFormElementValue(key)}
                          showChangeIndicator={true}
                          isHighlighted={highlightedFields.includes(key)}
                        >
                          <FormInput
                            id={key}
                            value={getFormElementValue(key)}
                            onChange={(v) => handleInputChange(key, v)}
                            placeholder={`Enter ${key === "TaxPeriodEndDt" ? "YYYY-MM-DD" : toLabel(key)}`}
                            onBlur={() => clearFieldHighlight()}
                          />
                        </FormField>
                      ))}
                    </div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="">
                <div>
                  <FormField label="Action Code" required>
                    <FormInput
                      onChange={(value) => handleInputChange('action_code', value)}
                      placeholder="Enter action code for suspension"
                    />
                  </FormField>
                </div>
              </FormSection>
            </form>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-4 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                clearFieldHighlight();
                handleSubmit();
              }}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => {
                clearFieldHighlight();
                console.log("Suspend form");
              }}
            >
              Suspend
            </button>
            {/* <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => {
                clearFieldHighlight();
                console.log("Close out form");
              }}
            >
              Close Out
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
