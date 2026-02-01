"use client";

// Force dynamic rendering for this page since it requires authentication
export const dynamic = "force-dynamic";

import {
  useEffect,
  useMemo,
  useState,
  Suspense,
  useRef,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import Header from "../../components/Header";
import Breadcrumbs, { createBreadcrumbs } from "../../components/Breadcrumbs";
import InfoAlert from "../../components/InfoAlert";
import FormSection, {
  FormField,
  FormInput,
  FormSelect,
} from "../../components/FormSection";
// import NotesSection from "../../components/NotesSection";
import { ErrorItem, Note } from "../../types";
import {
  workAssignmentService,
  FormElement,
  GMFError,
  AssignedWork,
  WorkRecord,
  AssignedWorkResponse,
} from "../../services/workAssignmentService";
// import { landingSearchService } from "../../services/landingSearchService";
import {
  SuspenseCodesService,
  SuspenseCode,
} from "../../services/suspenseCodesService";
import { useAuth } from "../../contexts/AuthContext";
import { useSeid, useUserGroup } from "../../hooks/useSeid";
import { getServiceCenterName } from "../../utils/serviceCenters";
// import DevBanner from "../../components/DevBanner";
import newFieldConfig from "../../data/fieldConfig4868.json";
import errorConfig from "../../data/errorConfig4868.json";

// Convert new field config array to lookup object for compatibility
const fieldConfig = newFieldConfig.reduce((acc: any, field: any) => {
  acc[field.key] = {
    label: field.label,
    validation: field.validation
  };
  return acc;
}, {});

// Timeout constants for auto-closeout functionality
const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const WARNING_DURATION = 2 * 60 * 1000; // Show warning 2 minutes before timeout

// Helper to prettify labels from keys like "primarySSN" -> "Primary SSN"
const toLabel = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

// Create Zod schema from field configuration
const createZodSchema = (fieldKey: string) => {
  const config = (fieldConfig as any)[fieldKey]?.validation;
  // if (!config) return z.string().optional();
  if (!config) return z.union([z.string(), z.number()]).optional();

  let schema = z.string();

  if (config.required) {
    schema = schema.min(1, config.messages.required);
  }

  if (config.minLength) {
    schema = schema.min(config.minLength, config.messages.minLength);
  }

  if (config.maxLength) {
    schema = schema.max(config.maxLength, config.messages.maxLength);
  }

  if (config.pattern) {
    schema = schema.regex(new RegExp(config.pattern), config.messages.pattern);
  }

  // Add custom validation for taxPrd field to ensure date is not in the future
  if (fieldKey === 'taxPrd') {
    schema = schema.refine((value) => {
      // Check if value matches YYYYMM format
      const match = value.match(/^(\d{4})(\d{2})$/);
      if (!match) return true; // Let pattern validation handle format errors
      
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      
      // Create date object for the entered month (using last day of month to be inclusive)
      const enteredDate = new Date(year, month - 1, 1); // month is 0-indexed
      const currentDate = new Date();
      
      // Compare year and month only (ignore day)
      const enteredYearMonth = year * 100 + month;
      const currentYearMonth = currentDate.getFullYear() * 100 + (currentDate.getMonth() + 1);
      
      return enteredYearMonth <= currentYearMonth;
    }, {
      message: "Tax Period cannot be in the future"
    });
  }

  // Add custom validation for meFReceiptDate field to ensure date is not in the future
  if (fieldKey === 'meFReceiptDate') {
    schema = schema.refine((value) => {
      // Check if value matches YYYY-MM-DD format
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return true; // Let pattern validation handle format errors
      
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      
      // Create date object for the entered date
      const enteredDate = new Date(year, month - 1, day); // month is 0-indexed
      const currentDate = new Date();
      
      // Set current date to end of day for comparison
      currentDate.setHours(23, 59, 59, 999);
      
      return enteredDate <= currentDate;
    }, {
      message: "Transaction Date cannot be in the future"
    });
  }

  return schema;
};

// Validate a single field
const validateField = (fieldKey: string, value: string): string | null => {
  try {
    const schema = createZodSchema(fieldKey);
    schema.parse(value);
    return null; // No error
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || "Invalid value";
    }
    return "Invalid value";
  }
};

function Form4868ERSPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const currentUserSeid = useSeid();
  const userGroup = useUserGroup();
  const isQrReviewer = searchParams.get("qrReviewer") === "true";
  const isReopen = searchParams.get("reopen") === "true";
  const [assignedWork, setAssignedWork] = useState<AssignedWork | null>(null);
  const [jsonWorkRecord, setJsonWorkRecord] = useState<any>(null);
  const [eraDto, setEraDto] = useState<any>(null);
  const [inventoryId, setInventoryId] = useState<string | null>(null);
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [originalFormElements, setOriginalFormElements] = useState<
    FormElement[]
  >([]);
  // const [landingSearchData, setLandingSearchData] = useState<any>(null);
  const [landingSelectionData, setLandingSelectionData] = useState<any>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Track fields that have been edited
  const [fieldWithErrors, setFieldWithErrors] = useState<string[]>([]);

  // Convert JSON work record to form elements based on editableFields
  // const convertJsonWorkRecordToFormElements = (jsonRecord: any): FormElement[] => {
  //   if (!jsonRecord?.workRecord?.editableFields) return [];

  //   const editableFields = jsonRecord.workRecord.editableFields;
  //   const workRecord = jsonRecord.workRecord;

  //   return Object.keys(editableFields).map((fieldKey, index) => ({
  //     id: fieldKey,
  //     name: fieldKey,
  //     label: toLabel(fieldKey),
  //     value: workRecord[fieldKey] || '',
  //     type: 'text',
  //     editable: true,
  //     hasFieldError: false
  //   }));
  // };

  // Convert ERA DTO to form elements using displayFields structure
  const convertEraDtoToFormElements = (eraData: any): FormElement[] => {
    if (!eraData) return [];

    // Get the data source (workRecord or root)
    const dataSource = eraData?.workRecord || eraData;

    // Use displayFields structure from eraDto
    const displayFields =
      eraData?.displayFields || eraData?.workRecord?.displayFields;
    if (displayFields) {
      // Create form elements based on displayFields structure
      const formElements: FormElement[] = [];

      // Iterate through newFieldConfig array to maintain JSON order
      newFieldConfig.forEach((fieldConfigItem: any) => {
        const fieldKey = fieldConfigItem.key;
        const displayFieldConfig = displayFields[fieldKey];
        
        // Only process fields that exist in displayFields
        if (displayFieldConfig) {
          const fieldValue = dataSource[fieldKey] || "";
          const fieldLabel = fieldConfigItem.label || toLabel(fieldKey);

          const formElement: FormElement = {
            id: fieldKey,
            name: fieldKey,
            label: fieldLabel,
            value: fieldValue,
            type: "text",
            editable: displayFieldConfig.editable,
            hasFieldError: displayFieldConfig.hasFieldError || false,
          };

          // Add to formElements array in the order they appear in newFieldConfig
          formElements.push(formElement);
        }
      });

      // Return form elements in the exact order from newFieldConfig
      return formElements;
    }

    // Fallback to fieldConfig approach
    const formElements: FormElement[] = [];
    const editableFields: FormElement[] = [];
    const nonEditableFields: FormElement[] = [];

    Object.entries(fieldConfig).forEach(
      ([fieldKey, config]: [string, any], index) => {
        const fieldValue = dataSource[fieldKey] || "";

        const formElement: FormElement = {
          id: fieldKey,
          name: fieldKey,
          label: config.label,
          value: fieldValue,
          type: "text",
          editable: config.editable || false,
          hasFieldError: false,
        };

        if (config.editable) {
          editableFields.push(formElement);
        } else {
          nonEditableFields.push(formElement);
        }
      }
    );

    // Return editable fields first, then non-editable fields
    return [...editableFields, ...nonEditableFields];
  };
  const [loading, setLoading] = useState(true);
  const [noWorkAvailable, setNoWorkAvailable] = useState(false);
  const [noWorkMessage, setNoWorkMessage] = useState<string>("");

  const editableFieldKeys: string[] = useMemo(() => {
    if (formElements.length > 0) {
      // Use actual form elements from API
      return formElements.filter((el) => el.editable).map((el) => el.name);
    }

    // Check for displayFields structure from eraDto
    const displayFields =
      eraDto?.displayFields || eraDto?.workRecord?.displayFields;
    if (displayFields) {
      return newFieldConfig
        .filter((fieldConfigItem: any) => {
          const displayFieldConfig = displayFields[fieldConfigItem.key];
          return displayFieldConfig && displayFieldConfig.editable;
        })
        .map((fieldConfigItem: any) => fieldConfigItem.key);
    }

    // Default fallback - return empty array if no structure found
    return [];
  }, [formElements, eraDto]);

  // Non-editable fields list from formElements
  const nonEditableFieldKeys: string[] = useMemo(() => {
    if (formElements.length > 0) {
      return formElements.filter((el) => !el.editable).map((el) => el.name);
    }

    // Check for displayFields structure
    const displayFields =
      eraDto?.displayFields || eraDto?.workRecord?.displayFields;
    if (displayFields) {
      return newFieldConfig
        .filter((fieldConfigItem: any) => {
          const displayFieldConfig = displayFields[fieldConfigItem.key];
          return displayFieldConfig && !displayFieldConfig.editable;
        })
        .map((fieldConfigItem: any) => fieldConfigItem.key);
    }

    return [];
  }, [formElements, eraDto]);

  // Map DTO keys to actual WorkRecord property names (simplified)
  const dtoToRecordKey = useMemo(
    (): Record<string, string> => ({
      TaxPeriodEndDt: "taxPeriodEndDt",
      primaryNameControlTxt: "primaryNameControlTxt",
      nameLine1Txt: "nameLine1Txt",
      primarySSN: "primarySSN",
    }),
    []
  );

  // Build initial values and original snapshot
  const initialValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const key of editableFieldKeys) {
      if (formElements.length > 0) {
        // Use actual form elements from API
        const element = workAssignmentService.getFormElementByName(
          formElements,
          key
        );
        values[key] = element?.value || "";
      } else {
        // Fallback to eraDto workRecord
        const workRecord = eraDto?.workRecord;
        if (workRecord) {
          const recordKey = dtoToRecordKey[key] || key;
          const v = (workRecord as any)?.[recordKey];
          values[key] = v ?? "";
        } else {
          values[key] = "";
        }
      }
    }
    return values;
  }, [editableFieldKeys, formElements, eraDto, dtoToRecordKey]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>(
    {}
  );
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clearCodesInput, setClearCodesInput] = useState<string>("");
  const [actionCode, setActionCode] = useState<string>("");
  const [suspenseCodes, setSuspenseCodes] = useState<SuspenseCode[]>([]);
  const [loadingSuspenseCodes, setLoadingSuspenseCodes] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [closingOut, setClosingOut] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  // Helper function to check if clear code is entered (C or c)
  const hasClearCode = useCallback(() => {
    const trimmed = clearCodesInput.trim().toLowerCase();
    return trimmed === "c";
  }, [clearCodesInput]);

  // Helper function to parse clear codes from comma-separated input (for error filtering)
  const getClearCodesArray = useCallback(() => {
    console.log(
      "getting clear codes array from clearCodesInput:",
      clearCodesInput
    );

    if (!clearCodesInput.trim()) {
      return [];
    }

    // Legacy support: parse comma-separated codes
    const result = clearCodesInput
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    console.log("final clear codes array:", result);
    return result;
  }, [clearCodesInput]);

  // Convert ERS reason codes to ErrorItem format for sidebar
  const convertErsErrorsToErrorItems = useCallback((): ErrorItem[] => {
    const fieldErrors: ErrorItem[] = [];
    const nonFieldErrors: ErrorItem[] = [];
    let errorIndex = 0;

    // Try ERA DTO first, then fallback to jsonWorkRecord
    let errorSource = null;
    let ersReasonCds: string[] = [];

    if (eraDto) {
      // For ERA DTO, check both root level and workRecord level
      errorSource = eraDto.workRecord || eraDto;
      ersReasonCds = errorSource.ersReasonCds || [];
    } else if (jsonWorkRecord?.workRecord) {
      errorSource = jsonWorkRecord.workRecord;
      ersReasonCds = errorSource.ersReasonCds || [];
    }

    // Process ERS reason codes
    if (errorSource && ersReasonCds.length > 0) {

      const filteredErrors = ersReasonCds.filter((code: string) => {
        // Check if this is a field error
        const errorConfigItem = (errorConfig as any)[code];
        const fieldMappings = errorConfigItem?.fieldMappings || [];
        const isFieldError = fieldMappings.length > 0;

        // Field errors are never cleared by clear codes
        if (isFieldError) {
          return true;
        }

        // Check if error is already cleared in the loaded eraDto.clearCodes
        const eraDtoClearCodes = eraDto?.clearCodes || [];
        if (eraDtoClearCodes.includes(code)) {
          console.log(
            `Error ${code} is already cleared in eraDto.clearCodes, hiding from display`
          );
          return false;
        }

        // For non-field errors, check if clear code is entered and error is clearable
        // if (clearCodeEntered && errorConfigItem?.clearable === true) {
        //   console.log(`Non-field error ${code} is cleared by clear code 'C'`);
        //   return false; // Hide this error
        // }


        return true; // Show this error
      });

      console.log(
        "Original errors:",
        ersReasonCds,
        "Filtered errors:",
        filteredErrors
      );

      filteredErrors.forEach((code: string) => {
        // Look up error configuration
        const errorConfigItem = (errorConfig as any)[code];
        const description =
          errorConfigItem?.description || `Error code: ${code}`;
        const fieldMappings = errorConfigItem?.fieldMappings || [];
        const isFieldError = fieldMappings.length > 0;

        const errorItem = {
          id: `ers-error-${errorIndex}`,
          code: code,
          description: description,
          type: "Error" as const,
          status: "active" as const,
          errorFields: fieldMappings, // Use fieldMappings from error config
          errorConfigKey: isFieldError ? code : undefined, // Add error config key for field errors only
          isFieldError: isFieldError, // Flag to identify field errors
          irm: {
            title: `IRM 3.12.${180 + errorIndex} - Error Resolution`,
            content: `Resolve the following error: ${description}`,
            steps: [
              "Review the error description",
              "Correct the identified issue in the highlighted fields",
              "Validate the correction",
            ],
          },
        };

        // Separate field errors from non-field errors
        if (isFieldError) {
          fieldErrors.push(errorItem);
        } else {
          nonFieldErrors.push(errorItem);
        }
        errorIndex++;
      });
    }

    // Process displayFields with hasFieldError: true
    const displayFields =
      eraDto?.displayFields || eraDto?.workRecord?.displayFields;
    if (displayFields) {
      Object.entries(displayFields).forEach(
        ([fieldKey, fieldConfig]: [string, any]) => {
          if (fieldConfig.hasFieldError === true) {
            // Find corresponding error config key for this field
            let errorConfigKey: string | undefined;
            let description = `Field error: ${fieldKey}`;

            // Look for error config entries that map to this field
            Object.entries(errorConfig).forEach(
              ([errorCode, errorConfigItem]: [string, any]) => {
                if (
                  errorConfigItem.fieldMappings &&
                  errorConfigItem.fieldMappings.includes(fieldKey)
                ) {
                  errorConfigKey = errorCode;
                  description = errorConfigItem.description || description;
                }
              }
            );

            // If no specific error config found, use field config for description
            if (!errorConfigKey) {
              const fieldConfigItem = (fieldConfig as any)[fieldKey];
              if (fieldConfigItem?.label) {
                description = `Field error: ${fieldConfigItem.label}`;
              }
            }

            fieldErrors.push({
              id: `field-error-${errorIndex}`,
              code: errorConfigKey || fieldKey,
              description: description,
              type: "Error" as const,
              status: "active" as const,
              errorFields: [fieldKey], // The field itself
              errorConfigKey: errorConfigKey, // Error config key if found
              isFieldError: true, // Always true for displayField errors
              irm: {
                title: `IRM 3.12.${180 + errorIndex} - Field Error Resolution`,
                content: `Resolve the following field error: ${description}`,
                steps: [
                  "Review the field error",
                  "Correct the value in the highlighted field",
                  "Validate the correction",
                ],
              },
            });
            errorIndex++;
          }
        }
      );
    }

    // Apply the new logic: show field errors first, or if none exist, show only the first non-field error
    let finalErrorItems: ErrorItem[] = [];

    if (fieldErrors.length > 0) {
      // Show all field errors
      finalErrorItems = fieldErrors;
      console.log(`Showing ${fieldErrors.length} field errors`);
    } else if (nonFieldErrors.length > 0) {
      // Sort non-field errors by error code (numerically) and show the lowest priority error
      console.log("Non-field errors before sorting:", nonFieldErrors.map(e => e.code));
      const sortedNonFieldErrors = nonFieldErrors.sort((a, b) => {
        const codeA = parseInt(a.code, 10);
        const codeB = parseInt(b.code, 10);
        console.log(`Comparing ${a.code} (${codeA}) vs ${b.code} (${codeB})`);
        return codeA - codeB; // Sort ascending (lowest first)
      });
      console.log("Non-field errors after sorting:", sortedNonFieldErrors.map(e => e.code));
      finalErrorItems = [sortedNonFieldErrors[0]];
      console.log(
        `No field errors found, showing lowest priority non-field error: ${sortedNonFieldErrors[0].code}`
      );
    }

    if (finalErrorItems.length === 0) {
      console.log(
        "No errors found. ErrorSource:",
        errorSource,
        "ersReasonCds:",
        ersReasonCds,
        "displayFields:",
        displayFields
      );
    }

    return finalErrorItems;
  }, [eraDto, jsonWorkRecord, getClearCodesArray]);

  // Fetch suspense codes on component mount
  useEffect(() => {
    const fetchSuspenseCodes = async () => {
      if (!currentUserSeid) return;

      setLoadingSuspenseCodes(true);
      try {
        const codesWithDetails =
          await SuspenseCodesService.getSuspenseCodesWithDetails(
            currentUserSeid
          );
        setSuspenseCodes(codesWithDetails);
      } catch (error) {
        console.error("Error fetching suspense codes:", error);
        // Fallback to empty array if fetch fails
        setSuspenseCodes([]);
      } finally {
        setLoadingSuspenseCodes(false);
      }
    };

    fetchSuspenseCodes();
  }, [currentUserSeid]);

  useEffect(() => {
    // Load ERA DTO from sessionStorage
    const storedEraDto = sessionStorage.getItem("eraDto");
    const storedSelectionData = sessionStorage.getItem("selectionData");

    if (storedEraDto) {
      const eraDtoData = JSON.parse(storedEraDto);
      setEraDto(eraDtoData);
      setInventoryId(eraDtoData.inventoryId || eraDtoData.id);

      // Update landingSelectionData with values from eraDto
      if (eraDtoData.serviceCenterId || eraDtoData.programId) {
        const updatedSelectionData = {
          ...landingSelectionData,
          serviceCenter: eraDtoData.serviceCenterId ? getServiceCenterName(eraDtoData.serviceCenterId).toLowerCase() : landingSelectionData?.serviceCenter,
          program: eraDtoData.programId || landingSelectionData?.program
        };
        setLandingSelectionData(updatedSelectionData);
      }

      // Populate action code from stored DTO
      // Note: clearCodesInput is separate from eraDtoData.clearCodes
      // eraDtoData.clearCodes contains actual error codes like ["111", "103"]
      // clearCodesInput only accepts 'C' or 'c' for UI input
      if (eraDtoData.suspendStatusCode) {
        setActionCode(eraDtoData.suspendStatusCode);
      }

      // Parse and set notes from new DTO
      if (eraDtoData.notes) {
        try {
          const parsedNotes =
            typeof eraDtoData.notes === "string"
              ? JSON.parse(eraDtoData.notes)
              : eraDtoData.notes;
          // Ensure all notes have stringified comments
          const normalizedNotes = Array.isArray(parsedNotes)
            ? parsedNotes.map((note) => ({
                ...note,
                comments:
                  typeof note.comments === "string"
                    ? note.comments
                    : JSON.stringify(note.comments),
              }))
            : [];
          setNotes(normalizedNotes);
          console.log("Notes parsed from new record:", parsedNotes);
        } catch (error) {
          console.error("Error parsing notes from new record:", error);
          setNotes([]);
        }
      } else {
        setNotes([]);
      }

      // Convert ERA DTO to form elements
      const elements = convertEraDtoToFormElements(eraDtoData);
      setFormElements(elements);
      setOriginalFormElements([...elements]);

      console.log("ERA DTO loaded from sessionStorage:", eraDtoData);
      console.log("Form elements created:", elements);
      console.log("ERA DTO workRecord:", eraDtoData.workRecord);
      console.log("Clear codes populated:", eraDtoData.clearCodes);
      console.log("Action code populated:", eraDtoData.suspendStatusCode);
    }

    if (storedSelectionData) {
      const selectionData = JSON.parse(storedSelectionData);
      setLandingSelectionData(selectionData);
      console.log("Selection data loaded:", selectionData);
    }

    setLoading(false);

    // Reset fieldWithErrors when component initializes
    setFieldWithErrors([]);
  }, []);

  // Set document title for the page
  useEffect(() => {
    document.title = "Work Record - IRS Error Resolution System";
  }, []);

  useEffect(() => {
    setValues(initialValues);
    setOriginalValues(initialValues);
  }, [initialValues]);

  // Load next work record from auto-assign endpoint
  const loadNextWorkRecord = async () => {
    try {
      setLoading(true);
      setActionCode("");
      setClearCodesInput("");
      setAdditionalNotes("");
      setFieldWithErrors([]);

      // Get selection data from sessionStorage
      const storedSelectionData = sessionStorage.getItem("selectionData");
      if (!storedSelectionData) {
        setNoWorkAvailable(true);
        setNoWorkMessage(
          "No selection data available. Please return to home page."
        );
        return;
      }

      const selectionData = JSON.parse(storedSelectionData);
      console.log("Selection data:", selectionData);

      // Build headers for auto-assign request
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        SERVICE_CENTER: selectionData.serviceCenter.toUpperCase(),
        PROGRAM_CODE: selectionData.program,
        SEID: `${currentUserSeid}`,
      };

      // Add SUSPEND_STATUS_CODE if statusCode is present
      if (selectionData.statusCode) {
        headers['SUSPEND_STATUS_CODE'] = selectionData.statusCode;
      }

      // Make GET request to auto-assign endpoint
      const response = await fetch("/api/v1/era/inventories/auto-assign", {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const eraDtoData = await response.json();

        // Update state with new ERA DTO
        setEraDto(eraDtoData);
        setInventoryId(eraDtoData.inventoryId || eraDtoData.id);

        // Update landingSelectionData with values from new eraDto
        if (eraDtoData.serviceCenterId || eraDtoData.programId) {
          setLandingSelectionData((prevData: any) => ({
            ...prevData,
            serviceCenter: eraDtoData.serviceCenterId ? getServiceCenterName(eraDtoData.serviceCenterId).toLowerCase() : prevData?.serviceCenter,
            program: eraDtoData.programId || prevData?.program
          }));
        }

        // Populate action code from new DTO
        // Note: clearCodesInput is separate from eraDtoData.clearCodes
        // eraDtoData.clearCodes contains actual error codes like ["111", "103"]
        // clearCodesInput only accepts 'C' or 'c' for UI input
        if (eraDtoData.suspendStatusCode) {
          setActionCode(eraDtoData.suspendStatusCode);
        }

        // Parse and set notes from new DTO
        if (eraDtoData.notes) {
          try {
            const parsedNotes =
              typeof eraDtoData.notes === "string"
                ? JSON.parse(eraDtoData.notes)
                : eraDtoData.notes;
            // Ensure all notes have stringified comments
            const normalizedNotes = Array.isArray(parsedNotes)
              ? parsedNotes.map((note) => ({
                  ...note,
                  comments:
                    typeof note.comments === "string"
                      ? note.comments
                      : JSON.stringify(note.comments),
                }))
              : [];
            setNotes(normalizedNotes);
            console.log("Notes parsed from new record:", parsedNotes);
          } catch (error) {
            console.error("Error parsing notes from new record:", error);
            setNotes([]);
          }
        } else {
          setNotes([]);
        }

        // Convert to form elements
        const elements = convertEraDtoToFormElements(eraDtoData);
        setFormElements(elements);
        setOriginalFormElements([...elements]);

        // Update sessionStorage
        sessionStorage.setItem("eraDto", JSON.stringify(eraDtoData));

        setNoWorkAvailable(false);
        console.log("New work record loaded:", eraDtoData);

        // Show info alert for new work record
        const dln = eraDtoData?.dln || eraDtoData?.workRecord?.dln || "N/A";
        setInfoMessage(`New work record loaded, DLN: ${dln}`);
        setShowInfo(true);
        setTimeout(() => setShowInfo(false), 20000);
      } else if (response.status === 204) {
        setNoWorkAvailable(true);
        setNoWorkMessage("No more work records available at this time.");
      } else {
        throw new Error(
          `Failed to get work assignment: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error loading next work record:", error);
      setNoWorkAvailable(true);
      setNoWorkMessage("Error loading work record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDLN = () =>
    eraDto?.workRecord?.dln || jsonWorkRecord?.workRecord?.dln || "N/A";

  const handleInputChange = (fieldKey: string, val: string) => {
    console.log(`handleInputChange called: ${fieldKey} = "${val}"`);

    // Convert primaryNameCtrl to uppercase automatically
    if (fieldKey === 'primaryNameCtrl') {
      val = val.toUpperCase();
    }

    // Convert meFReceiptDate from YYYYMMDD to YYYY-MM-DD format
    if (fieldKey === 'meFReceiptDate') {
      // Check if input is in YYYYMMDD format (8 digits, no dashes)
      if (/^\d{8}$/.test(val)) {
        const year = val.substring(0, 4);
        const month = val.substring(4, 6);
        const day = val.substring(6, 8);
        val = `${year}-${month}-${day}`;
      }
    }

    // Convert primarySSN by removing dashes
    if (fieldKey === 'primarySSN') {
      // Remove all dashes from SSN input
      val = val.replace(/-/g, '');
    }

    // Track that this field has been edited
    setFieldWithErrors((prev) => {
      if (!prev.includes(fieldKey)) {
        const updated = [...prev, fieldKey];
        console.log("Updated fieldWithErrors:", updated);
        return updated;
      }
      return prev;
    });

    // Validate the field value
    const validationError = validateField(fieldKey, val);
    console.log(
      `Validation result for ${fieldKey}:`,
      validationError || "Valid"
    );

    // Update validation errors state
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (validationError) {
        newErrors[fieldKey] = validationError;
      } else {
        delete newErrors[fieldKey];
      }
      console.log("Updated validation errors:", newErrors);
      return newErrors;
    });

    if (formElements.length > 0) {
      // Update form elements if using API data
      setFormElements((prev) => {
        const updated = workAssignmentService.updateFormElementValue(
          prev,
          fieldKey,
          val
        );
        console.log(
          `Updated formElements for ${fieldKey}:`,
          updated.find((el) => el.name === fieldKey)
        );
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

      // Only focus on fields for field errors, not other errors
      if (
        error.isFieldError &&
        error.errorFields &&
        error.errorFields.length > 0
      ) {
        const firstFieldId = error.errorFields[0];
        setTimeout(() => {
          const fieldElement = document.getElementById(firstFieldId);
          if (fieldElement) {
            fieldElement.focus();
            fieldElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100); // Small delay to ensure DOM is updated
      }
    }
  };

  // Helper function to get form element value by name
  const getFormElementValue = (name: string): string => {
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        formElements,
        name
      );
      return element?.value || "";
    }
    return values[name] || "";
  };

  // Helper function to get form element label by name
  const getFormElementLabel = (name: string): string => {
    // Always prioritize fieldConfig4868.json for labels
    const fieldConfigItem = (fieldConfig as any)[name];
    if (fieldConfigItem?.label) {
      return fieldConfigItem.label;
    }

    // Fallback to form element label if fieldConfig doesn't have it
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        formElements,
        name
      );
      if (element?.label) {
        return String(element.label);
      }
    }

    // Final fallback to generated label
    return toLabel(name);
  };

  // Helper function to get original value
  const getOriginalValue = (name: string): string => {
    if (originalFormElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        originalFormElements,
        name
      );
      return element?.value || "";
    }
    return originalValues[name] || "";
  };

  // Helper function to check if field has error (includes validation errors)
  const getFieldHasError = (name: string): boolean => {
    // Check for validation errors first (these always show)
    if (validationErrors[name]) {
      return true;
    }

    // Check for existing field errors from data, but only if value hasn't changed
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        formElements,
        name
      );
      const currentValue = getFormElementValue(name);
      const originalValue = getOriginalValue(name);

      // If the field has an error flag but the value has changed from original,
      // don't show the error (user is addressing it)
      if (element?.hasFieldError && currentValue !== originalValue) {
        return false;
      }

      return Boolean(element?.hasFieldError) || false;
    }
    return false;
  };

  // Helper function to get validation error message
  const getValidationError = (name: string): string | undefined => {
    // Always show validation errors
    if (validationErrors[name]) {
      return validationErrors[name];
    }

    // For original field errors, only show if value hasn't changed
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        formElements,
        name
      );
      const currentValue = getFormElementValue(name);
      const originalValue = getOriginalValue(name);

      // If field has error but value changed, don't show original error message
      if (element?.hasFieldError && currentValue !== originalValue) {
        return undefined;
      }

      // You could return a generic message for original field errors if needed
      // For now, returning undefined since we don't have specific error messages in the data
    }

    return undefined;
  };

  // Helper function to validate all editable fields
  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    editableFieldKeys.forEach((fieldKey) => {
      const value = getFormElementValue(fieldKey);
      const error = validateField(fieldKey, value);
      if (error) {
        errors[fieldKey] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to check if there are any field errors (validation or original)
  const hasAnyFieldErrors = (): boolean => {
    // Check for validation errors
    if (Object.keys(validationErrors).length > 0) {
      return true;
    }

    // Check for original field errors that haven't been addressed
    const allFieldKeys = [...editableFieldKeys, ...nonEditableFieldKeys];
    return allFieldKeys.some((fieldKey) => {
      if (formElements.length > 0) {
        const element = workAssignmentService.getFormElementByName(
          formElements,
          fieldKey
        );
        const currentValue = getFormElementValue(fieldKey);
        const originalValue = getOriginalValue(fieldKey);

        // If field has error and value hasn't changed, it's still an error
        return element?.hasFieldError && currentValue === originalValue;
      }
      return false;
    });
  };

  const mockNotes: Note[] = [];

  // Get error items (reactive to clear codes changes)
  const errorItems = useMemo(() => {
    return convertErsErrorsToErrorItems();
  }, [convertErsErrorsToErrorItems]);

  // Helper function to check if there are any field errors present
  const hasFieldErrors = useMemo(() => {
    return errorItems.some((error) => error.isFieldError);
  }, [errorItems]);

  // Helper function to get the current non-field error being displayed
  const currentNonFieldError = useMemo(() => {
    if (hasFieldErrors) return null; // No non-field error when field errors present
    return errorItems.toSorted((a, b) => {
      const codeA = parseInt(a.code, 10);
      const codeB = parseInt(b.code, 10);
      return codeA - codeB; // Sort ascending (lowest first)
    }).find((error) => !error.isFieldError) || null;
  }, [errorItems, hasFieldErrors]);

  // Helper function to check if the currently displayed non-field error is clearable
  const isCurrentErrorClearable = useMemo(() => {
    if (!currentNonFieldError) return false;

    const errorConfigItem = (errorConfig as any)[currentNonFieldError.code];
    return errorConfigItem?.clearable === true;
  }, [currentNonFieldError]);

  // Track previous error code to only clear input when error actually changes
  const prevErrorCodeRef = useRef<string | null>(null);
  
  // Reset clear code field when current error code actually changes
  useEffect(() => {
    const currentErrorCode = currentNonFieldError?.code || null;
    
    if (prevErrorCodeRef.current !== currentErrorCode) {
      console.log("currentNonFieldError code changed, clearing input:", prevErrorCodeRef.current, "→", currentErrorCode);
      setClearCodesInput("");
      prevErrorCodeRef.current = currentErrorCode;
    }
  }, [currentNonFieldError?.code]);

  // Helper function to check if user has delete permission for current program
  const hasDeletePermission = useMemo(() => {
    if (!user) {
      return false;
    }

    // Managers and analysts always have delete permission
    if (user.group === 'managers' || user.group === 'analysts') {
      return true;
    }

    // For tax examiners, check program-specific delete permission
    if (!user?.profile?.profile?.profiles || !landingSelectionData?.program) {
      return false;
    }

    const currentProgram = landingSelectionData.program;
    const programProfile = user.profile.profile.profiles[currentProgram];
    return programProfile?.deleteEnabled === true;
  }, [user, landingSelectionData]);

  // Helper function to generate clear codes array for payload
  const getPayloadClearCodes = useCallback(() => {
    console.log(
      "generating payload clear codes from clearCodesInput:",
      clearCodesInput
    );

    // Start with existing clear codes from eraDto
    const existingClearCodes = eraDto?.clearCodes || [];

    if (!clearCodesInput.trim()) {
      // If no new clear codes input, return existing clear codes
      console.log(
        "No new clear codes input, returning existing:",
        existingClearCodes
      );
      return existingClearCodes;
    }

    // Check if user entered 'C' or 'c' to clear current non-field error
    const trimmed = clearCodesInput.trim().toLowerCase();
    if (trimmed === "c" && currentNonFieldError) {
      const clearCode = currentNonFieldError.code;
      console.log(`Converting 'C' input to clear code: ${clearCode}`);

      // Add new clear code to existing ones if not already present
      const updatedClearCodes = existingClearCodes.includes(clearCode)
        ? existingClearCodes
        : [...existingClearCodes, clearCode];

      console.log("Updated clear codes with new code:", updatedClearCodes);
      return updatedClearCodes;
    }

    // Legacy support: parse comma-separated codes
    const newClearCodes = clearCodesInput
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

    // Combine existing and new clear codes, removing duplicates
    const combinedClearCodes = [
      ...new Set([...existingClearCodes, ...newClearCodes]),
    ];

    console.log("final payload clear codes array:", combinedClearCodes);
    return combinedClearCodes;
  }, [clearCodesInput, currentNonFieldError, eraDto?.clearCodes]);

  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showFlash, setShowFlash] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [showInfo, setShowInfo] = useState(false);

  // Timeout state for auto-closeout
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Ref for InfoAlert to focus on it when shown
  const infoAlertRef = useRef<HTMLDivElement>(null);

  // Focus on InfoAlert when it's shown
  useEffect(() => {
    if (showInfo && infoAlertRef.current) {
      // Small delay to ensure the component is rendered
      setTimeout(() => {
        infoAlertRef.current?.focus();
      }, 100);
    }
  }, [showInfo]);

  // Helper function to get current time in Eastern timezone as ISO string
  const getEasternTimestamp = () => {
    const now = new Date();
    // Get the timezone offset for Eastern time
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const utcTime = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const offset = easternTime.getTime() - utcTime.getTime();
    
    // Create a new date adjusted for Eastern timezone
    const easternDate = new Date(now.getTime() + offset);
    
    // Return as ISO string but representing Eastern time
    return easternDate.toISOString();
  };

  // Helper function to generate notes with field changes
  const generateNotesWithChanges = () => {
    const fieldChanges: any[] = [];
    const storedSelectionData = sessionStorage.getItem("selectionData");
    const selectionData = JSON.parse(storedSelectionData || "{}");
    const noteSeid = currentUserSeid || selectionData.seid || "unknown";

    // Check for form field changes
    formElements.forEach((element) => {
      const originalElement = originalFormElements.find(
        (orig) => orig.name === element.name
      );
      if (originalElement && originalElement.value !== element.value) {
        fieldChanges.push({
          fieldName: element.label || element.name,
          beforeValue: originalElement.value || "",
          afterValue: element.value || "",
        });
      }
    });

    // Check for clear codes changes
    const originalClearCodes = eraDto?.clearCodes || [];
    const currentClearCodes = getPayloadClearCodes();
    const originalClearCodesStr = Array.isArray(originalClearCodes)
      ? originalClearCodes.join(", ")
      : "";
    const currentClearCodesStr = currentClearCodes.join(", ");

    if (originalClearCodesStr !== currentClearCodesStr) {
      fieldChanges.push({
        fieldName: "Clear Codes",
        beforeValue: originalClearCodesStr,
        afterValue: currentClearCodesStr,
      });
    }

    // Check for action code changes
    const originalActionCode = eraDto?.suspendStatusCode || "";
    if (originalActionCode !== actionCode) {
      fieldChanges.push({
        fieldName: "Action Code",
        beforeValue: originalActionCode,
        afterValue: actionCode,
      });
    }

    // Get current errors being corrected
    const errorsBeingCorrected = errorItems.map(error => error.code);

    // Create new note if there are changes or additional notes
    if (fieldChanges.length > 0 || additionalNotes.trim()) {
      const commentsObj = {
        ...(fieldChanges.length > 0 && { fieldChanges: fieldChanges }),
        ...(additionalNotes.trim() && { additionalComments: additionalNotes }),
        ...(errorsBeingCorrected.length > 0 && { errorsBeingCorrected: errorsBeingCorrected }),
      };

      const newNote = {
        author: noteSeid,
        createdTime: getEasternTimestamp(),
        comments: JSON.stringify(commentsObj),
      };

      // Add to existing notes (notes are already normalized when loaded)
      const updatedNotes = [...notes, newNote];
      // return JSON.stringify(updatedNotes);
      return updatedNotes;
    }

    // Return existing notes as string if no changes (notes are already normalized)
    // return notes.length > 0 ? JSON.stringify(notes) : JSON.stringify([]);
    return notes.length > 0 ? notes : [];
  };

  const handleSuspend = async () => {
    if (!inventoryId || !actionCode.trim()) {
      setFlashMessage("Action Code is required for Suspend.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Check for validation errors before suspending
    if (Object.keys(validationErrors).length > 0) {
      setFlashMessage("Please fix validation errors before suspending.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 5000);
      return;
    }

    // Clear any highlighted fields on suspend
    setHighlightedFields([]);

    setSuspending(true);
    try {
      // Create updated ERA DTO with form changes
      const updatedEraDto = JSON.parse(JSON.stringify(eraDto)); // Deep clone

      // Ensure workRecord exists
      if (!updatedEraDto.workRecord) {
        updatedEraDto.workRecord = {};
      }

      // Update form element values in the workRecord section
      formElements.forEach((element) => {
        updatedEraDto.workRecord[element.name] = element.value;
      });

      const storedSelectionData = sessionStorage.getItem("selectionData");
      const selectionData = JSON.parse(storedSelectionData || "{}");

      const response = await fetch(
        `/api/v1/era/inventories/items/${inventoryId}/event`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            SEID: currentUserSeid || "X1000",
          },
          body: JSON.stringify({
            event: {
              eventStatus: "SUSPEND",
            },
            inventoryItem: {
              inventoryId: inventoryId,
              workRecord: updatedEraDto.workRecord,
              suspendStatusCode: actionCode,
              clearCodes: getPayloadClearCodes(),
              notes: generateNotesWithChanges(),
              fieldWithErrors: fieldWithErrors,
            },
          }),
        }
      );

      if (response.status === 200) {
        const result = await response.json();

        // Clear additional notes after successful operation
        setAdditionalNotes("");

        if (result.assignmentComplete) {
          if (isQrReviewer) {
            setFlashMessage(
              "Record suspended successfully. Returning to QR inventory..."
            );
            setShowFlash(true);
            setTimeout(() => {
              router.push("/qrInventory");
            }, 2000);
          } else if (isReopen) {
            setFlashMessage(
              "Record suspended successfully. Returning to daily summary..."
            );
            setShowFlash(true);
            setTimeout(() => {
              router.push("/daily-summary");
            }, 2000);
          } else {
            setFlashMessage(
              "Record suspended successfully. Loading next record..."
            );
            setShowFlash(true);

            try {
              await loadNextWorkRecord();
              setFlashMessage(
                "Record suspended successfully and new record retrieved"
              );
            } catch (fetchError) {
              console.error("Error fetching next work record:", fetchError);
              setFlashMessage(
                "Record suspended successfully but failed to fetch new record"
              );
            }

            setTimeout(() => setShowFlash(false), 4000);
          }
        } else {
          // Assignment not complete - update current record with workRecord from inventoryItem
          const updatedRecord = result.inventoryItem;

          if (updatedRecord) {
            // Preserve programId and serviceCenterId from original eraDto if missing in response
            const recordWithPreservedFields = {
              ...updatedRecord,
              programId: updatedRecord.programId || eraDto?.programId,
              serviceCenterId: updatedRecord.serviceCenterId || eraDto?.serviceCenterId
            };
            
            setEraDto(recordWithPreservedFields);
            setInventoryId(
              result.inventoryId ||
                updatedRecord.inventoryId ||
                updatedRecord.id
            );

            // Convert to form elements
            const elements = convertEraDtoToFormElements(updatedRecord);
            setFormElements(elements);
            setOriginalFormElements([...elements]);

            // Parse and update notes from updatedRecord
            if (updatedRecord.notes) {
              try {
                const parsedNotes =
                  typeof updatedRecord.notes === "string"
                    ? JSON.parse(updatedRecord.notes)
                    : updatedRecord.notes;
                // Ensure all notes have stringified comments
                const normalizedNotes = Array.isArray(parsedNotes)
                  ? parsedNotes.map((note) => ({
                      ...note,
                      comments:
                        typeof note.comments === "string"
                          ? note.comments
                          : JSON.stringify(note.comments),
                    }))
                  : [];
                setNotes(normalizedNotes);
                console.log(
                  "Notes updated from API response:",
                  normalizedNotes
                );
              } catch (error) {
                console.error(
                  "Error parsing notes from updated record:",
                  error
                );
                setNotes([]);
              }
            } else {
              setNotes([]);
            }

            // Update sessionStorage
            sessionStorage.setItem("eraDto", JSON.stringify(recordWithPreservedFields));

            // Show info alert for additional error correction needed
            setInfoMessage("Requires additional error correction");
            setShowInfo(true);
            setTimeout(() => setShowInfo(false), 10000);

            setFlashMessage(
              "Record suspended and submitted for validation. Record updated"
            );
          } else {
            setFlashMessage("Record suspended and submitted for validation");
          }

          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 4000);
        }
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error suspending record:", error);
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      }
    } catch (error) {
      console.error("Error suspending record:", error);
      // setFlashMessage("Error suspending record. Please try again.");
      // setShowFlash(true);
      // setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSuspending(false);
    }
  };

  const handleCloseout = useCallback(async () => {
    console.log("handleCloseout called");
    console.log("inventoryId:", inventoryId);

    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Validate all editable fields before closing out
    // if (!validateAllFields()) {
    //   setFlashMessage("Please fix validation errors before closing out.");
    //   setShowFlash(true);
    //   setTimeout(() => setShowFlash(false), 5000);
    //   return;
    // }

    // Clear any highlighted fields on closeout
    setHighlightedFields([]);

    setClosingOut(true);
    console.log("Setting closingOut to true");
    try {
      // Create updated ERA DTO with form changes
      const updatedEraDto = JSON.parse(JSON.stringify(eraDto)); // Deep clone

      // Ensure workRecord exists
      if (!updatedEraDto.workRecord) {
        updatedEraDto.workRecord = {};
      }

      // Update form element values in the workRecord section
      formElements.forEach((element) => {
        updatedEraDto.workRecord[element.name] = element.value;
      });

      const storedSelectionData = sessionStorage.getItem("selectionData");
      const selectionData = JSON.parse(storedSelectionData || "{}");

      console.log(
        "Making PATCH request to:",
        `/api/v1/era/inventories/${inventoryId}/event`
      );
      console.log("Request body:", { eventStatus: "CLOSEOUT" });

      const response = await fetch(
        `/api/v1/era/inventories/${inventoryId}/event`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            SEID: `${currentUserSeid}`,
          },
          body: JSON.stringify({ eventStatus: "CLOSEOUT" }),
        }
      );

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.status === 200) {
        const result = await response.json();

        // Clear additional notes after successful operation
        setAdditionalNotes("");

        if (isQrReviewer) {
          setFlashMessage(
            "Record closed out successfully. Returning to QR inventory..."
          );
          setShowFlash(true);
          setTimeout(() => {
            router.push("/qrInventory");
          }, 2000);
        } else if (isReopen) {
          setFlashMessage(
            "Record closed out successfully. Returning to daily summary..."
          );
          setShowFlash(true);
          setTimeout(() => {
            router.push("/daily-summary");
          }, 2000);
        } else {
          setInfoMessage(
            "Record closed out successfully. You will be redirected to the home page in a few seconds."
          );
          setShowInfo(true);

          // Navigate to home after a brief delay to show the message
          setTimeout(() => {
            router.push("/home");
          }, 3000);
        }
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error closing out record:", error);
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
        // throw new Error(`Closeout failed: ${errorText}`);
      }
    } catch (error) {
      console.error("Error closing out record:", error);
      setFlashMessage("Error closing out record. Please try again.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setClosingOut(false);
    }
  }, [inventoryId, formElements, eraDto, landingSelectionData, currentUserSeid, router]);

  const handleDelete = async () => {
    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Clear any highlighted fields on delete
    setHighlightedFields([]);

    setDeleting(true);
    try {
      // Create updated ERA DTO with form changes
      const updatedEraDto = JSON.parse(JSON.stringify(eraDto)); // Deep clone

      // Ensure workRecord exists
      if (!updatedEraDto.workRecord) {
        updatedEraDto.workRecord = {};
      }

      // Update form element values in the workRecord section
      formElements.forEach((element) => {
        updatedEraDto.workRecord[element.name] = element.value;
      });

      const storedSelectionData = sessionStorage.getItem("selectionData");
      const selectionData = JSON.parse(storedSelectionData || "{}");

      const response = await fetch(
        `/api/v1/era/inventories/items/${inventoryId}/event`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            SEID: `${currentUserSeid}`,
          },
          body: JSON.stringify({
            event: {
              eventStatus: "DELETED",
            },
            inventoryItem: {
              inventoryId: inventoryId,
              workRecord: updatedEraDto.workRecord,
              clearCodes: getPayloadClearCodes(),
              notes: generateNotesWithChanges(),
              fieldWithErrors: fieldWithErrors,
            },
          }),
        }
      );

      if (response.status === 200) {
        const result = await response.json();

        // Clear additional notes after successful operation
        setAdditionalNotes("");

        if (result.assignmentComplete) {
          if (isQrReviewer) {
            setFlashMessage(
              "Record deleted successfully. Returning to QR inventory..."
            );
            setShowFlash(true);
            setTimeout(() => {
              router.push("/qrInventory");
            }, 2000);
          } else if (isReopen) {
            setFlashMessage(
              "Record deleted successfully. Returning to daily summary..."
            );
            setShowFlash(true);
            setTimeout(() => {
              router.push("/daily-summary");
            }, 2000);
          } else {
            setFlashMessage(
              "Record deleted successfully. Loading next record..."
            );
            setShowFlash(true);

            try {
              await loadNextWorkRecord();
              setFlashMessage(
                "Record deleted successfully and new record retrieved"
              );
            } catch (fetchError) {
              console.error("Error fetching next work record:", fetchError);
              setFlashMessage(
                "Record deleted successfully but failed to fetch new record"
              );
            }
          }
        } else {
          setFlashMessage("Record deleted successfully");
          setShowFlash(true);
        }

        setTimeout(() => setShowFlash(false), 4000);
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error deleting record:", error);
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
        // throw new Error(`Delete failed: ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      setFlashMessage("Error deleting record. Please try again.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async () => {
    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Validate all editable fields before submission
    const validationErrors: Record<string, string> = {};
    editableFieldKeys.forEach((fieldKey) => {
      const value = getFormElementValue(fieldKey);
      const error = validateField(fieldKey, value);
      if (error) {
        validationErrors[fieldKey] = error;
      }
    });

    // If there are validation errors, prevent submission and show errors
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors(validationErrors);
      setFlashMessage("Please fix validation errors before submitting.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 5000);
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
      formElements.forEach((element) => {
        console.log(`Updating field ${element.name}: "${element.value}"`);
        updatedEraDto.workRecord[element.name] = element.value;
      });

      console.log("Original ERA DTO:", eraDto);
      console.log("Updated ERA DTO being sent:", updatedEraDto);
      console.log("Form elements being applied:", formElements);
      console.log("WorkRecord after updates:", updatedEraDto.workRecord);

      const storedSelectionData = sessionStorage.getItem("selectionData");
      const selectionData = JSON.parse(storedSelectionData || "{}");

      // POST to revalidate endpoint
      // const response = await fetch(`/api/v1/era/inventories/${inventoryId}/revalidate`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'SEID': selectionData.seid || 'u1000'
      //   },
      //   body: JSON.stringify(updatedEraDto)
      // });

      const response = await fetch(
        `/api/v1/era/inventories/items/${inventoryId}/event`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            SEID: `${currentUserSeid}`,
          },
          body: JSON.stringify({
            event: {
              eventStatus: "RESOLVED",
            },
            inventoryItem: {
              inventoryId: inventoryId,
              workRecord: updatedEraDto.workRecord,
              clearCodes: getPayloadClearCodes(),
              notes: generateNotesWithChanges(),
              fieldWithErrors: fieldWithErrors,
            },
          }),
        }
      );

      if (response.status === 200) {
        const result = await response.json();

        // Clear additional notes after successful operation
        setAdditionalNotes("");

        if (result.assignmentComplete) {
          // Assignment complete - get next record from auto-assign or navigate to QR inventory
          if (isQrReviewer) {
            setFlashMessage(
              "Form submitted successfully. Returning to QR inventory..."
            );
            setShowFlash(true);
            setTimeout(() => {
              router.push("/qrInventory");
            }, 2000);
          } else if (isReopen) {
            setFlashMessage(
              "Form submitted successfully. Returning to daily summary..."
            );
            setShowFlash(true);
            setTimeout(() => {
              router.push("/daily-summary");
            }, 2000);
          } else {
            setFlashMessage(
              "Form submitted successfully. Loading next record..."
            );
            setShowFlash(true);

            try {
              await loadNextWorkRecord();
              setFlashMessage(
                "Form submitted successfully and new record retrieved"
              );
            } catch (fetchError) {
              console.error("Error fetching next work record:", fetchError);
              setFlashMessage(
                "Form submitted successfully but failed to fetch new record"
              );
            }

            setTimeout(() => setShowFlash(false), 4000);
          }
        } else {
          // Assignment not complete - update current record with workRecord from inventoryItem
          // const updatedRecord = result.inventoryItem?.workRecord;
          const updatedRecord = result.inventoryItem;

          if (updatedRecord) {
            // Preserve programId and serviceCenterId from original eraDto if missing in response
            const recordWithPreservedFields = {
              ...updatedRecord,
              programId: updatedRecord.programId || eraDto?.programId,
              serviceCenterId: updatedRecord.serviceCenterId || eraDto?.serviceCenterId
            };
            
            setEraDto(recordWithPreservedFields);
            setInventoryId(
              result.inventoryId ||
                updatedRecord.inventoryId ||
                updatedRecord.id
            );

            // Convert to form elements
            const elements = convertEraDtoToFormElements(updatedRecord);
            setFormElements(elements);
            setOriginalFormElements([...elements]);

            // Parse and update notes from updatedRecord
            if (updatedRecord.notes) {
              try {
                const parsedNotes =
                  typeof updatedRecord.notes === "string"
                    ? JSON.parse(updatedRecord.notes)
                    : updatedRecord.notes;
                // Ensure all notes have stringified comments
                const normalizedNotes = Array.isArray(parsedNotes)
                  ? parsedNotes.map((note) => ({
                      ...note,
                      comments:
                        typeof note.comments === "string"
                          ? note.comments
                          : JSON.stringify(note.comments),
                    }))
                  : [];
                setNotes(normalizedNotes);
                console.log(
                  "Notes updated from API response:",
                  normalizedNotes
                );
              } catch (error) {
                console.error(
                  "Error parsing notes from updated record:",
                  error
                );
                setNotes([]);
              }
            } else {
              setNotes([]);
            }

            // Update sessionStorage
            sessionStorage.setItem("eraDto", JSON.stringify(recordWithPreservedFields));

            // Show info alert for additional error correction needed
            setInfoMessage("Requires additional error correction");
            setShowInfo(true);
            setTimeout(() => setShowInfo(false), 10000);

            setFlashMessage("Form submitted for validation. Record updated");
          } else {
            setFlashMessage("Form submitted for validation");
          }

          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 4000);
        }
      } else if (response.status === 204) {
        // Clear additional notes after successful operation
        setAdditionalNotes("");

        // No content - get next record from auto-assign or navigate to QR inventory
        if (isQrReviewer) {
          setFlashMessage(
            "Form submitted successfully. Returning to QR inventory..."
          );
          setShowFlash(true);
          setTimeout(() => {
            router.push("/qrInventory");
          }, 2000);
        } else if (isReopen) {
          setFlashMessage(
            "Form submitted successfully. Returning to daily summary..."
          );
          setShowFlash(true);
          setTimeout(() => {
            router.push("/daily-summary");
          }, 2000);
        } else {
          setFlashMessage(
            "Form submitted successfully. Loading next record..."
          );
          setShowFlash(true);

          try {
            await loadNextWorkRecord();
            setFlashMessage(
              "Form submitted successfully and new record retrieved"
            );
          } catch (fetchError) {
            console.error("Error fetching next work record:", fetchError);
            setFlashMessage(
              "Form submitted successfully but failed to fetch new record"
            );
          }

          setTimeout(() => setShowFlash(false), 4000);
        }
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        console.error("Error submitting form:", error);
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFlashMessage("Error submitting form. Please try again.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Add keyboard event handler for Page Up key to trigger handleSubmit
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      // Check if Page Up key is pressed (key code 33 or key name 'PageUp')
      if (event.key === "PageUp" || event.keyCode === 33) {
        event.preventDefault();
        console.log(
          "Page Up key pressed - checking if handleSubmit can be called"
        );

        // Only call handleSubmit if inventoryId is available and there are no field errors
        if (!inventoryId) {
          console.log("inventoryId not available - ignoring Page Up key");
          return;
        }

        if (hasAnyFieldErrors()) {
          console.log("Field errors present - ignoring Page Up key");
          setFlashMessage("Field errors need to be fixed for submission");
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 3000);
          return;
        }

        console.log(
          "inventoryId available and no field errors - triggering handleSubmit"
        );
        handleSubmit();
      }
    };

    // Add event listener to document
    document.addEventListener("keyup", handleKeyUp);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    inventoryId,
    validationErrors,
    formElements,
    editableFieldKeys,
    nonEditableFieldKeys,
  ]); // Include all dependencies for hasAnyFieldErrors()

  // Auto-closeout timeout functionality
  useEffect(() => {

    const resetTimeout = () => {
      lastActivityRef.current = Date.now();
      setTimeoutWarning(false);

      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      // Set warning timeout (8 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        setTimeoutWarning(true);
        setInfoMessage("Session will timeout in 2 minutes due to inactivity. The record will be automatically closed out.");
        setShowInfo(true);
        console.log("Timeout warning shown - 2 minutes remaining");
      }, TIMEOUT_DURATION - WARNING_DURATION);

      // Set main timeout (10 minutes)
      timeoutRef.current = setTimeout(() => {
        console.log("Auto-closeout triggered after timeout duration:", TIMEOUT_DURATION);
        console.log("handleCloseout function:", typeof handleCloseout);
        setInfoMessage("Session timed out due to inactivity. Closing out record...");
        setShowInfo(true);
        
        // Trigger closeout after a brief delay to show the message
        setTimeout(() => {
          console.log("About to call handleCloseout...");
          handleCloseout();
        }, 1000);
      }, TIMEOUT_DURATION);
    };

    const handleUserActivity = (event: Event) => {
      // Only reset timeout for meaningful user interactions
      const target = event.target as HTMLElement;
      
      // Ignore activity on timeout warning elements
      if (target?.closest('[data-timeout-warning]')) {
        return;
      }

      resetTimeout();
    };

    // Activity event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus', 'blur'];
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Initialize timeout on component mount
    resetTimeout();

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [handleCloseout]); // Include handleCloseout as dependency

  // Ref to track if closeout has been sent (persists across renders)
  const closeoutSentRef = useRef(false);

  // Unified closeout function used by all event handlers
  const performCloseout = useCallback((source: string) => {
    if (closeoutSentRef.current || !inventoryId || !currentUserSeid) {
      console.log(`⚠️ Skipping closeout from ${source}:`, { 
        alreadySent: closeoutSentRef.current, 
        hasInventoryId: !!inventoryId, 
        hasSeid: !!currentUserSeid 
      });
      return;
    }
    
    closeoutSentRef.current = true;
    console.log(`✅ TRIGGERING CLOSEOUT from ${source}`, {
      inventoryId,
      currentUserSeid,
      url: `/api/v1/era/inventories/${inventoryId}/event`
    });

    const payload = JSON.stringify({ eventStatus: "CLOSEOUT" });
    const url = `/api/v1/era/inventories/${inventoryId}/event`;
    
    // Use fetch with keepalive - supports headers unlike sendBeacon
    // keepalive ensures request continues even if page unloads
    try {
      fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "SEID": currentUserSeid,
        },
        body: payload,
        keepalive: true,
      })
        .then(response => {
          console.log(`📡 Closeout response from ${source}:`, response.status, response.statusText);
          return response.text();
        })
        .then(data => {
          console.log(`📡 Closeout response body from ${source}:`, data);
        })
        .catch(error => {
          console.error(`❌ Closeout fetch failed from ${source}:`, error);
        });
    } catch (error) {
      console.error(`❌ Closeout error from ${source}:`, error);
    }
  }, [inventoryId, currentUserSeid]);

  // Browser event handlers for closeout (browser close, refresh, tab close)
  useEffect(() => {
    console.log("🔵 Installing browser event handlers");

    // Handle browser close, tab close, refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log("🔴 beforeunload event triggered");
      performCloseout("beforeunload");
    };

    // Handle tab switching, browser minimization, window focus loss
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log("🔴 Page became hidden (tab switch/minimize)");
        performCloseout("visibilitychange");
      }
    };

    // Handle navigation away from page (fallback)
    const handlePageHide = (event: PageTransitionEvent) => {
      console.log("🔴 pagehide event triggered");
      performCloseout("pagehide");
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup function
    return () => {
      console.log("🔵 Removing browser event handlers");
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [performCloseout]);

  // Component unmount handler for back button navigation
  // This is needed because Next.js App Router unmounts the component before popstate fires
  useEffect(() => {
    console.log("🔵 Navigation closeout handler installed");

    // Cleanup function runs when component unmounts (including back button navigation)
    return () => {
      console.log("🔴 Component unmounting - triggering closeout");
      performCloseout("unmount");
    };
  }, [performCloseout]);

  // Function to dismiss timeout warning
  const dismissTimeoutWarning = () => {
    setTimeoutWarning(false);
    setShowInfo(false);
    
    // Reset the timeout when user dismisses warning
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    lastActivityRef.current = Date.now();
    
    // Restart the timeout cycle
    warningTimeoutRef.current = setTimeout(() => {
      setTimeoutWarning(true);
      setInfoMessage("Session will timeout in 2 minutes due to inactivity. The record will be automatically closed out.");
      setShowInfo(true);
    }, TIMEOUT_DURATION - WARNING_DURATION);

    timeoutRef.current = setTimeout(() => {
      console.log("Auto-closeout triggered after timeout warning dismissal");
      setInfoMessage("Session timed out due to inactivity. Closing out record...");
      setShowInfo(true);
      setTimeout(() => {
        handleCloseout();
      }, 1000);
    }, TIMEOUT_DURATION);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* <Header user={mockUser} showBackButton backHref="/home" /> */}
        <Header hideNav={true} />

        {/* Breadcrumbs */}
        {/* <div className="px-4 pt-4 pb-2">
          <Breadcrumbs items={createBreadcrumbs.workRecord()} />
        </div> */}

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
        {/* <Header user={mockUser} showBackButton backHref="/home" /> */}
        <Header hideNav={true} />

        {/* Breadcrumbs */}
        {/* <div className="px-4 pt-4 pb-2">
          <Breadcrumbs items={createBreadcrumbs.workRecord()} />
        </div> */}

        <div className="p-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              No Work Records Available
            </h1>
            <p className="text-gray-600 mb-4">{noWorkMessage}</p>
            <button
              onClick={() => router.push('/home')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  // Show error if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">
            Authentication required. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  function getProgram(): string {
    return eraDto?.program || jsonWorkRecord?.workRecord?.program || "";
  }

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      {/* <DevBanner /> */}
      <Header disableDailySummary={true} hideNav={true} />

      {/* Breadcrumbs */}
      {/* <div className="px-4 pt-4 pb-2">
        <Breadcrumbs items={[
          { label: 'Home' }, // No href = disabled
          { label: 'Work Record', isActive: true }
        ]} />
      </div> */}

      {/* Info Alert */}
      {showInfo && (
        <div className="px-4 pt-6 pb-2" data-timeout-warning={timeoutWarning ? "true" : undefined}>
          <InfoAlert
            ref={infoAlertRef}
            message={infoMessage}
            onClose={timeoutWarning ? dismissTimeoutWarning : () => setShowInfo(false)}
            showDismissButton={timeoutWarning}
            dismissButtonText={timeoutWarning ? "Continue Working" : undefined}
            variant={timeoutWarning ? "warning" : "info"}
          />
        </div>
      )}

      {showFlash && (
        <div className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in-right">
          <span>{flashMessage}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mx-4 mt-4 mb-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="info-badge inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200" aria-label="Document Locator Number">
              DLN: {getDLN()}
            </span>
            <span className="info-badge inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200" aria-label="Inventory Identifier">
              Inventory ID: {inventoryId}
            </span>
            <span className="info-badge inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-200" aria-label="Service Center Location">
              Service Center: {eraDto?.serviceCenterId && getServiceCenterName(eraDto.serviceCenterId)}
            </span>
            <span className="info-badge inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200" aria-label="Program Identifier">
              Program: {eraDto?.programId}
            </span>
            {landingSelectionData.statusCode && (
              <span className="info-badge inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200" aria-label="Current Status Code">
                Status Code: {landingSelectionData.statusCode}
              </span>
            )}
          </div>
          {/* <button className="inline-flex items-center gap-2 px-6 py-2 bg-[#0f507e] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[#0f507e] hover:-translate-y-0.5 shadow-sm">
            View RRD Data
          </button> */}
        </div>
      </div>

      {/* Error Badges Section - Only show if there are visible errors */}
      {errorItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 mx-4 mb-6 border border-gray-100">
          <h2 className="error-badges-title text-base font-semibold mb-4 text-gray-700">
            Errors
          </h2>
          <div className="error-badges-container flex flex-wrap gap-2">
            {errorItems.map((error) => (
              <div
                key={error.id}
                className={`error-badge cursor-pointer transition-all duration-200 px-3.5 py-2 rounded-2xl text-sm font-medium flex items-center gap-2 ${
                  selectedErrorId === error.id
                    ? "bg-red-100 text-red-800 border border-red-300 shadow-md transform -translate-y-0.5"
                    : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                }`}
                onClick={() => handleErrorClick(error)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleErrorClick(error);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Error ${error.code}: ${error.description}. Click to ${selectedErrorId === error.id ? 'deselect' : 'select'} this error.`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="opacity-80"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                {error.code} - {error.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid - 60% Form / 40% Notes */}
      <div id="main-content" className="grid grid-cols-1 lg:grid-cols-[1fr_0.67fr] gap-6 px-4 pb-4 min-h-[600px] max-w-full overflow-hidden">
        {/* Form Section (Left 60%) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <form className="space-y-8">
              <FormSection title="Form 4868 - Application for Automatic Extension">
                <div className="space-y-8 px-1">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-2">
                      <FormField label="Clear Codes" required={false} htmlFor="clearCodesInput">
                        <FormInput
                          id="clearCodesInput"
                          value={clearCodesInput}
                          onChange={(value) => {
                            // Only allow 'C' or 'c' characters
                            const filteredValue = value.replace(/[^Cc]/g, "");
                            // Limit to single character
                            const singleChar = filteredValue.slice(0, 1);
                            setClearCodesInput(singleChar);
                          }}
                          placeholder={
                            hasFieldErrors
                              ? "Disabled - resolve field errors first"
                              : isCurrentErrorClearable
                              ? "Enter 'C' to clear error"
                              : "Current error not clearable"
                          }
                          disabled={hasFieldErrors || !isCurrentErrorClearable}
                        />
                        {/* <div className="mt-1 text-xs text-gray-600">
                          {hasFieldErrors ? "Clear codes disabled when field errors are present" : (isCurrentErrorClearable ? "Enter 'C' to clear the current error" : "Current error is not clearable")}
                        </div> */}
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editableFieldKeys.map((key) => (
                        <FormField
                          key={key}
                          label={getFormElementLabel(key)}
                          htmlFor={key}
                          originalValue={getOriginalValue(key)}
                          currentValue={getFormElementValue(key)}
                          showChangeIndicator={true}
                          isHighlighted={highlightedFields.includes(key)}
                          error={getValidationError(key)}
                        >
                          <FormInput
                            id={key}
                            value={getFormElementValue(key)}
                            onChange={(v) => handleInputChange(key, v)}
                            placeholder={`Enter ${getFormElementLabel(key)}`}
                            onBlur={() => clearFieldHighlight()}
                            error={getFieldHasError(key)}
                          />
                        </FormField>
                      ))}
                    </div>

                    {/* Non-Editable Fields Section */}
                    {nonEditableFieldKeys.length > 0 && (
                      <div className="mt-2">
                        <div className="text-md font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {nonEditableFieldKeys.map((key) => (
                            <FormField
                              key={key}
                              label={getFormElementLabel(key)}
                              htmlFor={key}
                              error={getValidationError(key)}
                            >
                              <FormInput
                                id={key}
                                value={getFormElementValue(key)}
                                disabled={true}
                                error={getFieldHasError(key)}
                              />
                            </FormField>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </FormSection>
              <FormSection title="">
                <div>
                  <FormField label="Action Code" required htmlFor="actionCodeSelect">
                    <FormSelect
                      id="actionCodeSelect"
                      value={actionCode}
                      onChange={(value) => {
                        setActionCode(value);
                        handleInputChange("suspendStatusCode", value);
                      }}
                      disabled={loadingSuspenseCodes}
                    >
                      <option value="">
                        {loadingSuspenseCodes
                          ? "Loading suspense codes..."
                          : "Select action code"}
                      </option>
                      {suspenseCodes.map((suspenseCode) => (
                        <option
                          key={suspenseCode.code}
                          value={suspenseCode.code}
                        >
                          {suspenseCode.code} - {suspenseCode.description} (
                          {suspenseCode.daysSuspended} days)
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>
                </div>
              </FormSection>
            </form>
          </div>

          {/* Field Error Warning Message */}
          {hasAnyFieldErrors() && (
            <div className="mt-3 text-left">
              <p className="text-sm text-red-600 font-medium">
                Field errors need to be fixed for submission
              </p>
            </div>
          )}
        </div>

        {/* Notes Section (Right 40%) */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col h-full min-w-0 overflow-hidden">
          <div className="notes-title text-lg font-semibold mb-4 pb-2 border-b border-gray-200 text-gray-700 flex-shrink-0">
            Notes
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Additional Notes Input */}
            <div className="additional-notes-input mb-4 flex-shrink-0">
              <label htmlFor="additionalNotesTextarea" className="block text-sm font-medium text-gray-700 mb-2">
                Add Additional Notes:
              </label>
              <textarea
                id="additionalNotesTextarea"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Enter additional notes here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="notes-content flex-1 space-y-4">
              {notes.length === 0 ? (
                <div className="text-gray-500 text-sm">No notes available</div>
              ) : (
                notes.map((note, index) => (
                  <div
                    key={index}
                    className="note-entry border-b border-gray-100 pb-4 last:border-b-0"
                  >
                    <div className="note-header mb-2">
                      <div className="text-sm font-medium text-gray-700">
                        Author: {note.author || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created At:{" "}
                        {note.createdTime
                          ? new Date(note.createdTime).toLocaleString()
                          : "Unknown"}
                      </div>
                    </div>

                    {note.comments &&
                      (() => {
                        try {
                          // Handle different comment formats
                          let parsedComments = note.comments;

                          // If comments is a string, try to parse it as JSON first
                          if (typeof note.comments === "string") {
                            try {
                              parsedComments = JSON.parse(note.comments);
                            } catch {
                              // If JSON parsing fails, treat it as a plain string
                              parsedComments = note.comments;
                            }
                          }

                          console.log("note.comments", note.comments);
                          console.log("parsedComments", parsedComments);

                          // Handle case where parsedComments is a plain string
                          if (typeof parsedComments === "string") {
                            return (
                              <div className="note-comments">
                                <div className="text-sm text-gray-700 whitespace-pre-line">
                                  {parsedComments}
                                </div>
                              </div>
                            );
                          }

                          // Handle case where parsedComments is an object with properties
                          return (
                            <div className="note-comments">
                              {parsedComments.fieldChanges &&
                                parsedComments.fieldChanges.length > 0 && (
                                  <div className="field-changes mb-3">
                                    <div className="text-sm font-medium text-gray-600 mb-1">
                                      Field Changes:
                                    </div>
                                    <div className="ml-4 space-y-1">
                                      {parsedComments.fieldChanges.map(
                                        (change: any, changeIndex: number) => (
                                          <div
                                            key={changeIndex}
                                            className="text-xs text-gray-600"
                                          >
                                            <span className="font-medium">
                                              {change.fieldName}:
                                            </span>{" "}
                                            {change.beforeValue} →{" "}
                                            {change.afterValue}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                              {parsedComments.additionalComments && (
                                <div className="additional-comments mb-3">
                                  <div className="text-sm font-medium text-gray-600 mb-1">
                                    Additional Comments:
                                  </div>
                                  <div className="text-sm text-gray-700 whitespace-pre-line ml-4">
                                    {parsedComments.additionalComments}
                                  </div>
                                </div>
                              )}

                              {parsedComments.errorsBeingCorrected &&
                                parsedComments.errorsBeingCorrected.length > 0 && (
                                  <div className="errors-being-corrected">
                                    <div className="text-sm font-medium text-gray-600 mb-1">
                                      Errors Being Corrected:
                                    </div>
                                    <div className="text-sm text-gray-700 ml-4">
                                      {parsedComments.errorsBeingCorrected.join(", ")}
                                    </div>
                                  </div>
                                )}
                            </div>
                          );
                        } catch (error) {
                          console.error("Error parsing comments:", error);
                          return (
                            <div className="text-xs text-red-500">
                              Error displaying comments
                            </div>
                          );
                        }
                      })()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Positioned after notes for proper tab order */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mx-4 mb-4">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <button
              type="button"
              className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 shadow-sm ${
                submitting
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-[#0f507e] text-white hover:bg-[#0f507e] hover:-translate-y-0.5"
              }`}
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
              className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 shadow-sm ${
                !actionCode.trim() ||
                suspending ||
                Object.keys(validationErrors).length > 0
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-[#0f507e] text-white hover:bg-[#0f507e] hover:-translate-y-0.5"
              }`}
              onClick={() => {
                clearFieldHighlight();
                handleSuspend();
              }}
              disabled={
                !actionCode.trim() ||
                suspending ||
                Object.keys(validationErrors).length > 0
              }
            >
              {suspending ? "Suspending..." : "Suspend"}
            </button>
            <button
              type="button"
              className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 shadow-sm ${
                closingOut
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-[#0f507e] text-white hover:bg-[#0f507e] hover:-translate-y-0.5"
              }`}
              onClick={() => {
                console.log("Close Out button clicked");
                clearFieldHighlight();
                handleCloseout();
              }}
              disabled={closingOut}
            >
              {closingOut ? "Closing Out..." : "Close Out"}
            </button>
          </div>
          <div className="flex gap-4">
            {hasDeletePermission && (
              <button
                type="button"
                className={`px-6 py-2 font-medium rounded-lg transition-all duration-200 shadow-sm ${
                  deleting
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700 hover:-translate-y-0.5"
                }`}
                onClick={() => {
                  clearFieldHighlight();
                  handleDelete();
                }}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        {/* Field Error Warning Message */}
        {hasAnyFieldErrors() && (
          <div className="mt-3 text-left">
            <p className="text-sm text-red-600 font-medium">
              Field errors need to be fixed for submission
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Form4868ERSPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <Form4868ERSPageContent />
    </Suspense>
  );
}
