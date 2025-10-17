"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
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
  const [eraDto, setEraDto] = useState<any>(null);
  const [inventoryId, setInventoryId] = useState<string | null>(null);
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

  // Convert ERA DTO to form elements
  const convertEraDtoToFormElements = (eraData: any): FormElement[] => {
    // Check both workRecord level and root level for editableFields
    const editableFields = eraData?.workRecord?.editableFields || eraData?.editableFields;
    if (!editableFields) return [];
    
    // Get the data source (workRecord or root)
    const dataSource = eraData?.workRecord || eraData;
    
    return Object.keys(editableFields).map((fieldKey, index) => ({
      id: fieldKey,
      name: fieldKey,
      label: toLabel(fieldKey),
      value: dataSource[fieldKey] || '',
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
    // Try ERA DTO first, then fallback to jsonWorkRecord
    let errorSource = null;
    let ersReasonCds: string[] = [];
    let errReasonCdsMap: Record<string, string> = {};
    
    if (eraDto) {
      // For ERA DTO, check both root level and workRecord level
      errorSource = eraDto.workRecord || eraDto;
      ersReasonCds = errorSource.ersReasonCds || [];
      errReasonCdsMap = errorSource.errReasonCdsMap || {};
    } else if (jsonWorkRecord?.workRecord) {
      errorSource = jsonWorkRecord.workRecord;
      ersReasonCds = errorSource.ersReasonCds || [];
      errReasonCdsMap = errorSource.errReasonCdsMap || {};
    }
    
    if (!errorSource || ersReasonCds.length === 0) {
      console.log('No errors found. ErrorSource:', errorSource, 'ersReasonCds:', ersReasonCds);
      return [];
    }
    
    // console.log('Converting errors:', ersReasonCds, 'with map:', errReasonCdsMap);
    
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
    // Load ERA DTO from sessionStorage
    const storedEraDto = sessionStorage.getItem('eraDto');
    const storedSelectionData = sessionStorage.getItem('selectionData');
    
    if (storedEraDto) {
      const eraDtoData = JSON.parse(storedEraDto);
      setEraDto(eraDtoData);
      setInventoryId(eraDtoData.inventoryId || eraDtoData.id);
      
      // Convert ERA DTO to form elements
      const elements = convertEraDtoToFormElements(eraDtoData);
      setFormElements(elements);
      setOriginalFormElements([...elements]);
      
      console.log('ERA DTO loaded from sessionStorage:', eraDtoData);
      console.log('Form elements created:', elements);
      console.log('ERA DTO workRecord:', eraDtoData.workRecord);
    } else {
      // Fallback: Load from eraDto.json for development/testing
      import('../../data/eraDto.json').then((eraData) => {
        setEraDto(eraData.default);
        setInventoryId(String(eraData.default.inventoryId));
        
        // Convert ERA DTO to form elements
        const elements = convertEraDtoToFormElements(eraData.default);
        setFormElements(elements);
        setOriginalFormElements([...elements]);
        
        console.log('ERA DTO loaded from fallback file:', eraData.default);
        console.log('Form elements created:', elements);
        console.log('ERA DTO workRecord:', eraData.default.workRecord);
      });
    }
    
    if (storedSelectionData) {
      const selectionData = JSON.parse(storedSelectionData);
      setLandingSelectionData(selectionData);
      console.log('Selection data loaded:', selectionData);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    setValues(initialValues);
    setOriginalValues(initialValues);
  }, [initialValues]);

  // Load next work record from auto-assign endpoint
  const loadNextWorkRecord = async () => {
    try {
      setLoading(true);
      
      // Get selection data from sessionStorage
      const storedSelectionData = sessionStorage.getItem('selectionData');
      if (!storedSelectionData) {
        setNoWorkAvailable(true);
        setNoWorkMessage('No selection data available. Please return to home page.');
        return;
      }
      
      const selectionData = JSON.parse(storedSelectionData);
      
      // Make GET request to auto-assign endpoint
      const response = await fetch('/api/v1/era/inventories/auto-assign', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'SERVICE_CENTER': selectionData.serviceCenter.toUpperCase(),
          'PROGRAM_CODE': selectionData.program || selectionData.statusCode,
          'SEID': selectionData.seid || 'u1000'
        }
      });

      if (response.ok) {
        const eraDtoData = await response.json();
        
        // Update state with new ERA DTO
        setEraDto(eraDtoData);
        setInventoryId(eraDtoData.inventoryId || eraDtoData.id);
        
        // Convert to form elements
        const elements = convertEraDtoToFormElements(eraDtoData);
        setFormElements(elements);
        setOriginalFormElements([...elements]);
        
        // Update sessionStorage
        sessionStorage.setItem('eraDto', JSON.stringify(eraDtoData));
        
        setNoWorkAvailable(false);
        console.log('New work record loaded:', eraDtoData);
      } else if (response.status === 204) {
        setNoWorkAvailable(true);
        setNoWorkMessage('No more work records available at this time.');
      } else {
        throw new Error(`Failed to get work assignment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading next work record:', error);
      setNoWorkAvailable(true);
      setNoWorkMessage('Error loading work record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDLN = () => eraDto?.dln || jsonWorkRecord?.workRecord?.dln || ersWorkRecord?.dln || "N/A";

  const handleInputChange = (fieldKey: string, val: string) => {
    console.log(`handleInputChange called: ${fieldKey} = "${val}"`);
    
    if (formElements.length > 0) {
      // Update form elements if using API data
      setFormElements(prev => {
        const updated = workAssignmentService.updateFormElementValue(prev, fieldKey, val);
        console.log(`Updated formElements for ${fieldKey}:`, updated.find(el => el.name === fieldKey));
        return updated;
      });
    } else {
      // Update local values if using ersDto fallback
      console.log(`Updating local values for ${fieldKey}`);
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
    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Clear any highlighted fields on submit
    setHighlightedFields([]);
    
    setSubmitting(true);
    try {
      // Create updated ERA DTO with form changes
      const updatedEraDto = JSON.parse(JSON.stringify(eraDto)); // Deep clone
      
      // Ensure workRecord exists
      if (!updatedEraDto.workRecord) {
        updatedEraDto.workRecord = {};
      }
      
      // Update form element values in the workRecord section
      formElements.forEach(element => {
        console.log(`Updating field ${element.name}: "${element.value}"`);
        updatedEraDto.workRecord[element.name] = element.value;
      });
      
      console.log('Original ERA DTO:', eraDto);
      console.log('Updated ERA DTO being sent:', updatedEraDto);
      console.log('Form elements being applied:', formElements);
      console.log('WorkRecord after updates:', updatedEraDto.workRecord);
      
      // POST to revalidate endpoint
      const response = await fetch(`/api/v1/era/inventories/${inventoryId}/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedEraDto)
      });
      
      if (response.status === 200) {
        // Get the updated record from response and show form
        const updatedRecord = await response.json();
        
        setEraDto(updatedRecord);
        setInventoryId(updatedRecord.inventoryId || updatedRecord.id);
        
        // Convert to form elements
        const elements = convertEraDtoToFormElements(updatedRecord);
        setFormElements(elements);
        setOriginalFormElements([...elements]);
        
        // Update sessionStorage
        sessionStorage.setItem('eraDto', JSON.stringify(updatedRecord));
        
        setFlashMessage('Form submitted successfully and record updated');
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 4000);
        
      } else if (response.status === 204) {
        // No content - get next record from auto-assign
        setFlashMessage('Form submitted successfully. Loading next record...');
        setShowFlash(true);
        
        try {
          await loadNextWorkRecord();
          setFlashMessage('Form submitted successfully and new record retrieved');
        } catch (fetchError) {
          console.error('Error fetching next work record:', fetchError);
          setFlashMessage('Form submitted successfully but failed to fetch new record');
        }
        
        setTimeout(() => setShowFlash(false), 4000);
        
      } else {
        const errorText = await response.text();
        throw new Error(`Revalidate failed: ${errorText}`);
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

  if (noWorkAvailable || (!loading && !eraDto)) {
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
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
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
              // <span className="info-badge inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
              //   {landingSelectionData.program && `Program: ${landingSelectionData.program}`}
              //   {landingSelectionData.statusCode && `Status: ${landingSelectionData.statusCode}`}
              //   {landingSelectionData.serviceCenter && ` | ${landingSelectionData.serviceCenter.toUpperCase()}`}
              // </span>
              <span className="info-badge inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
              {landingSelectionData.program && `Service Center: ${landingSelectionData.serviceCenter.toUpperCase()}`}
            </span>

            )}
          </div>
          {/* <button className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f507e] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm">
            View RRD Data
          </button> */}
        </div>
      </div>

      {/* Error Badges Section */}
      <div className="bg-white rounded-xl shadow-sm p-5 mx-4 mb-6 border border-gray-100">
        <div className="error-badges-title text-base font-semibold mb-4 text-gray-700">Active Errors</div>
        <div className="error-badges-container flex flex-wrap gap-2">
          {errorItems.map((error) => (
            <div
              key={error.id}
              className={`error-badge cursor-pointer transition-all duration-200 px-3.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 ${
                selectedErrorId === error.id
                  ? 'bg-red-100 text-red-800 border border-red-300 shadow-md transform -translate-y-0.5'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:transform hover:-translate-y-0.5 hover:shadow-md'
              }`}
              onClick={() => handleErrorClick(error)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-80">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error.code} - {error.description}
            </div>
          ))}
          {errorItems.length === 0 && (
            <div className="text-gray-500 text-sm italic">No active errors</div>
          )}
        </div>
      </div>

      {/* Main Content Grid - 60% Form / 40% Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.67fr] gap-6 px-4 pb-4 min-h-[600px] max-w-full overflow-hidden">
        {/* Form Section (Left 60%) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              <FormSection 
                title="Form 4868 - Application for Automatic Extension"
                metadata={{
                  receivedDate: eraDto?.transDt ? new Date(eraDto.transDt).toLocaleDateString() : (jsonWorkRecord?.workRecord?.transDt ? new Date(jsonWorkRecord.workRecord.transDt).toLocaleDateString() : (ersWorkRecord?.transDt ? new Date(ersWorkRecord.transDt).toLocaleDateString() : undefined)),
                  taxPeriod: eraDto?.taxPrd || ersWorkRecord?.taxPrd,
                }}
              >
                <div className="space-y-8 px-1">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Editable Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => {
                clearFieldHighlight();
                console.log("Close out form");
              }}
            >
              Close Out
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-[#0f507e] text-white font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm"
              onClick={() => {
                clearFieldHighlight();
                console.log("Delete form");
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Notes Section (Right 40%) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col max-h-[600px] min-w-0 overflow-hidden">
          <div className="notes-title text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-700 flex-shrink-0">
            Resolution Notes
          </div>
          
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <NotesSection notes={mockNotes} onAddNote={(content) => console.log("Add note:", content)} />
          </div>
        </div>
      </div>
    </div>
  );
}
