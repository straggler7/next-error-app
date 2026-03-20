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
import {
  getFormDef,
  getFieldDefById,
  getAllSectionFields,
  getSectionAllFields,
  getErrorDef,
} from "../../forms/registry";
import type { FormDef, SectionDef } from "../../forms/types";
import SectionSideNav from "../../components/SectionSideNav";

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

// Build a Zod schema from a FieldDef's validation config
const createZodSchemaFromDef = (formDef: FormDef, fieldId: string) => {
  const validation = getFieldDefById(formDef, fieldId)?.validation;
  if (!validation) return z.union([z.string(), z.number()]).optional();

  let schema = z.string();
  if (validation.required) schema = schema.min(1, validation.messages.required ?? "Required");
  if (validation.minLength) schema = schema.min(validation.minLength, validation.messages.minLength ?? `Min ${validation.minLength} chars`);
  if (validation.maxLength) schema = schema.max(validation.maxLength, validation.messages.maxLength ?? `Max ${validation.maxLength} chars`);
  if (validation.pattern) schema = schema.regex(new RegExp(validation.pattern), validation.messages.pattern ?? "Invalid format");
  return schema;
};

// Validate a single field against the form definition
const validateField = (fieldKey: string, value: string, formDef: FormDef): string | null => {
  try {
    const schema = createZodSchemaFromDef(formDef, fieldKey);
    schema.parse(value);
    return null;
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
  const isDlnSearch = searchParams.get("dlnSearch") === "true";
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

  // Form definition — derived from the form type in the loaded ERA DTO
  const formDef = useMemo<FormDef>(() => {
    const formType = eraDto?.workRecord?.formType || eraDto?.formType;
    return getFormDef(formType ?? "4868");
  }, [eraDto]);

  // Active section tab (empty string = default to first visible section)
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  // Active right-panel tab
  const [activeRightTab, setActiveRightTab] = useState<"notes" | "errors">("notes");

  // Validation state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Track fields that have been edited
  const [fieldWithErrors, setFieldWithErrors] = useState<string[]>([]);

  // Convert ERA DTO to form elements using displayFields structure
  const convertEraDtoToFormElements = useCallback((eraData: any): FormElement[] => {
    if (!eraData) return [];

    // Get the data source (workRecord or root)
    const dataSource = eraData?.workRecord || eraData;

    // Use displayFields structure from eraDto
    const displayFields =
      eraData?.displayFields || eraData?.workRecord?.displayFields;
    if (displayFields) {
      // Create form elements based on displayFields structure
      const formElements: FormElement[] = [];

      // Iterate through form definition fields (registry order) to build elements
      const formType = dataSource?.formType || eraData?.formType || "4868";
      const def = getFormDef(formType);
      const allConfigFields = getAllSectionFields(def);

      return allConfigFields.reduce<FormElement[]>((acc, fieldDef) => {
        const displayFieldConfig = displayFields[fieldDef.id];
        if (displayFieldConfig) {
          acc.push({
            id: fieldDef.id,
            name: fieldDef.id,
            label: fieldDef.label,
            value: dataSource[fieldDef.id] ?? "",
            type: fieldDef.type,
            editable: displayFieldConfig.editable,
            hasFieldError: displayFieldConfig.hasFieldError || false,
          });
        }
        return acc;
      }, []);
    }

    // Fallback: use form def fields directly (no displayFields from API)
    const formType = dataSource?.formType || eraData?.formType || "4868";
    const def = getFormDef(formType);
    const allConfigFields = getAllSectionFields(def);
    const editableFields: FormElement[] = [];
    const nonEditableFields: FormElement[] = [];

    allConfigFields.forEach((fieldDef) => {
      const element: FormElement = {
        id: fieldDef.id,
        name: fieldDef.id,
        label: fieldDef.label,
        value: dataSource[fieldDef.id] ?? "",
        type: fieldDef.type,
        editable: fieldDef.editable,
        hasFieldError: false,
      };
      if (fieldDef.editable) {
        editableFields.push(element);
      } else {
        nonEditableFields.push(element);
      }
    });

    return [...editableFields, ...nonEditableFields];
  }, []);
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
      return getAllSectionFields(formDef)
        .filter((fieldDef) => {
          const displayFieldConfig = displayFields[fieldDef.id];
          return displayFieldConfig && displayFieldConfig.editable;
        })
        .map((fieldDef) => fieldDef.id);
    }

    return [];
  }, [formElements, eraDto, formDef]);

  // Non-editable fields list from formElements
  const nonEditableFieldKeys: string[] = useMemo(() => {
    if (formElements.length > 0) {
      return formElements.filter((el) => !el.editable).map((el) => el.name);
    }

    const displayFields =
      eraDto?.displayFields || eraDto?.workRecord?.displayFields;
    if (displayFields) {
      return getAllSectionFields(formDef)
        .filter((fieldDef) => {
          const displayFieldConfig = displayFields[fieldDef.id];
          return displayFieldConfig && !displayFieldConfig.editable;
        })
        .map((fieldDef) => fieldDef.id);
    }

    return [];
  }, [formElements, eraDto, formDef]);

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
    

    if (!clearCodesInput.trim()) {
      return [];
    }

    // Legacy support: parse comma-separated codes
    const result = clearCodesInput
      .split(",")
      .map((code) => code.trim())
      .filter((code) => code.length > 0);

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
        // Check if this is a field error using form registry
        const errorDef = getErrorDef(formDef, code);
        const isFieldError = errorDef?.category === "field" || (errorDef?.affectedFieldIds.length ?? 0) > 0;

        // Field errors are never cleared by clear codes
        if (isFieldError) {
          return true;
        }

        // Check if error is already cleared in the loaded eraDto.clearCodes
        const eraDtoClearCodes = eraDto?.clearCodes || [];
        if (eraDtoClearCodes.includes(code)) {
          
          return false;
        }

        return true; // Show this error
      });

      

      filteredErrors.forEach((code: string) => {
        // Look up error definition from form registry
        const errorDef = getErrorDef(formDef, code);
        const description = errorDef?.description || `Error code: ${code}`;
        const affectedFields = errorDef?.affectedFieldIds || [];
        const isFieldError = errorDef?.category === "field" || affectedFields.length > 0;

        const errorItem = {
          id: `ers-error-${errorIndex}`,
          code: code,
          description: description,
          type: "Error" as const,
          status: "active" as const,
          errorFields: affectedFields,
          errorConfigKey: isFieldError ? code : undefined,
          isFieldError: isFieldError,
          irm: errorDef?.irm || {
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

            // Find error def that maps to this field
            const matchingErrorDef = formDef.errors.find(
              (e) => e.affectedFieldIds.includes(fieldKey)
            );
            if (matchingErrorDef) {
              errorConfigKey = matchingErrorDef.code;
              description = matchingErrorDef.description;
            }

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
    } else if (nonFieldErrors.length > 0) {
      // Sort non-field errors by error code (numerically) and show the lowest priority error
      const sortedNonFieldErrors = nonFieldErrors.sort((a, b) => {
        const codeA = parseInt(a.code, 10);
        const codeB = parseInt(b.code, 10);
        return codeA - codeB; // Sort ascending (lowest first)
      });
      finalErrorItems = [sortedNonFieldErrors[0]];
      
    }

    if (finalErrorItems.length === 0) {
      
    }

    return finalErrorItems;
  }, [eraDto, jsonWorkRecord, formDef]);

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
        // Fallback to empty array if fetch fails
        setSuspenseCodes([]);
      } finally {
        setLoadingSuspenseCodes(false);
      }
    };

    fetchSuspenseCodes();
  }, [currentUserSeid]);

  useEffect(() => {
    // DEV PREVIEW: ?preview=940 loads mock Form 940 data without needing the API
    if (process.env.NODE_ENV === "development") {
      const previewForm = searchParams.get("preview");
      if (previewForm) {
        import(`../../data/eraDto${previewForm}.json`)
          .then((mod) => {
            const eraDtoData = mod.default;
            sessionStorage.setItem("eraDto", JSON.stringify(eraDtoData));
            sessionStorage.setItem("selectionData", JSON.stringify({
              serviceCenter: "16",
              program: eraDtoData.programId,
            }));
            window.location.replace(`/workRecord`);
          })
          .catch(() => {
            console.warn(`No mock data found for form: ${previewForm}`);
          });
        return;
      }
    }

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
        } catch (error) {
          setNotes([]);
        }
      } else {
        setNotes([]);
      }

      // Convert ERA DTO to form elements
      const elements = convertEraDtoToFormElements(eraDtoData);
      setFormElements(elements);
      setOriginalFormElements([...elements]);

    }

    if (storedSelectionData) {
      const selectionData = JSON.parse(storedSelectionData);
      setLandingSelectionData(selectionData);
    }

    setLoading(false);

    // Reset fieldWithErrors when component initializes
    setFieldWithErrors([]);
  }, [landingSelectionData, convertEraDtoToFormElements]);

  // Set document title for the page
  useEffect(() => {
    document.title = "Work Record - IRS Error Resolution System";
  }, []);

  useEffect(() => {
    setValues(initialValues);
    setOriginalValues(initialValues);
  }, [initialValues]);

  // Load next work record from auto-assign endpoint
  const loadNextWorkRecord = useCallback(async () => {
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
          } catch (error) {
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
      setNoWorkAvailable(true);
      setNoWorkMessage("Error loading work record. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUserSeid, convertEraDtoToFormElements]);

  const getDLN = () =>
    eraDto?.workRecord?.dln || jsonWorkRecord?.workRecord?.dln || "N/A";

  const handleInputChange = (fieldKey: string, val: string) => {

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
        return updated;
      }
      return prev;
    });

    // Validate the field value
    const validationError = validateField(fieldKey, val, formDef);
    

    // Update validation errors state
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (validationError) {
        newErrors[fieldKey] = validationError;
      } else {
        delete newErrors[fieldKey];
      }
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
        return updated;
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

      // Switch to the section that owns this error
      const errorDef = getErrorDef(formDef, error.code);
      if (errorDef?.sectionId) {
        setActiveSectionId(errorDef.sectionId);
      }

      // Open Error Details panel so examiner sees IRM guidance immediately
      setActiveRightTab("errors");

      // Focus the first affected field for field errors
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
        }, 100);
      }
    }
  };

  // Helper function to get form element value by name
  const getFormElementValue = useCallback((name: string): string => {
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        formElements,
        name
      );
      return element?.value || "";
    }
    return values[name] || "";
  }, [formElements, values]);

  // Helper function to get form element label by name
  const getFormElementLabel = (name: string): string => {
    // Prefer label from form registry
    const fieldDef = getFieldDefById(formDef, name);
    if (fieldDef?.label) return fieldDef.label;

    // Fall back to the label on the runtime form element (from API)
    if (formElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(formElements, name);
      if (element?.label) return String(element.label);
    }

    return toLabel(name);
  };

  // Helper function to get original value
  const getOriginalValue = useCallback((name: string): string => {
    if (originalFormElements.length > 0) {
      const element = workAssignmentService.getFormElementByName(
        originalFormElements,
        name
      );
      return element?.value || "";
    }
    return originalValues[name] || "";
  }, [originalFormElements, originalValues]);

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
      const error = validateField(fieldKey, value, formDef);
      if (error) {
        errors[fieldKey] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to validate only fields that have been changed by the user
  const validateChangedFields = useCallback((): Record<string, string> => {
    const changedFieldErrors: Record<string, string> = {};
    editableFieldKeys.forEach((fieldKey) => {
      // Only validate if field was changed by user
      if (fieldWithErrors.includes(fieldKey)) {
        const value = getFormElementValue(fieldKey);
        const error = validateField(fieldKey, value, formDef);
        if (error) {
          changedFieldErrors[fieldKey] = error;
        }
      }
    });
    return changedFieldErrors;
  }, [editableFieldKeys, fieldWithErrors, getFormElementValue]);

  // Helper function to check if there are any field errors (validation or original)
  const hasAnyFieldErrors = useCallback((): boolean => {
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
  }, [validationErrors, editableFieldKeys, nonEditableFieldKeys, formElements, getFormElementValue, getOriginalValue]);

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
    return getErrorDef(formDef, currentNonFieldError.code)?.clearable === true;
  }, [currentNonFieldError, formDef]);

  // ─── Section navigation memos ────────────────────────────────────────────

  // Currently selected error (for Error Details panel)
  const selectedError = useMemo(() => {
    return selectedErrorId
      ? errorItems.find((e) => e.id === selectedErrorId) ?? null
      : null;
  }, [selectedErrorId, errorItems]);

  // Error counts per section (drives red badges on section tabs)
  const errorCountBySection = useMemo(() => {
    const counts: Record<string, number> = {};
    errorItems.forEach((error) => {
      const sectionId = getErrorDef(formDef, error.code)?.sectionId;
      if (sectionId) {
        counts[sectionId] = (counts[sectionId] ?? 0) + 1;
      }
    });
    return counts;
  }, [formDef, errorItems]);

  // Sections visible given current field values (evaluates section conditions)
  const visibleSections = useMemo(() => {
    const fieldValues: Record<string, string> = {};
    formElements.forEach((el) => { fieldValues[el.id] = el.value; });

    return formDef.sections.filter((section) => {
      if (!section.condition) return true;
      const { fieldId, operator, value } = section.condition;
      const fieldValue = fieldValues[fieldId] ?? "";
      switch (operator) {
        case "eq":     return fieldValue === value;
        case "neq":    return fieldValue !== value;
        case "truthy": return !!fieldValue && fieldValue !== "false" && fieldValue !== "0";
        case "falsy":  return !fieldValue || fieldValue === "false" || fieldValue === "0";
        case "in":     return Array.isArray(value) && value.includes(fieldValue);
        default:       return true;
      }
    });
  }, [formDef, formElements]);

  // The resolved active section (falls back to first visible if state is stale/empty)
  const effectiveActiveSectionId = useMemo(() => {
    if (activeSectionId && visibleSections.some((s) => s.id === activeSectionId)) {
      return activeSectionId;
    }
    return visibleSections[0]?.id ?? "";
  }, [activeSectionId, visibleSections]);

  const activeSection = useMemo<SectionDef | null>(() => {
    return visibleSections.find((s) => s.id === effectiveActiveSectionId) ?? null;
  }, [visibleSections, effectiveActiveSectionId]);

  // Errors belonging to the currently active section (or all errors for single-section forms)
  const activeSectionErrors = useMemo(() => {
    if (visibleSections.length <= 1) return errorItems;
    return errorItems.filter(
      (error) => getErrorDef(formDef, error.code)?.sectionId === effectiveActiveSectionId
    );
  }, [errorItems, formDef, visibleSections.length, effectiveActiveSectionId]);

  // Field IDs belonging to the active section (includes subsections)
  const activeSectionFieldIds = useMemo(() => {
    if (!activeSection) return new Set<string>();
    return new Set(getSectionAllFields(activeSection).map((f) => f.id));
  }, [activeSection]);

  // Editable / non-editable keys scoped to the active section (for rendering only)
  const activeSectionEditableKeys = useMemo(() => {
    if (activeSectionFieldIds.size === 0) return editableFieldKeys;
    return editableFieldKeys.filter((k) => activeSectionFieldIds.has(k));
  }, [activeSectionFieldIds, editableFieldKeys]);

  const activeSectionNonEditableKeys = useMemo(() => {
    if (activeSectionFieldIds.size === 0) return nonEditableFieldKeys;
    return nonEditableFieldKeys.filter((k) => activeSectionFieldIds.has(k));
  }, [activeSectionFieldIds, nonEditableFieldKeys]);

  // Look up line number for a field from the form definition
  const getLineNumber = (fieldId: string): string | undefined =>
    getFieldDefById(formDef, fieldId)?.lineNumber;

  // Track previous error code to only clear input when error actually changes
  const prevErrorCodeRef = useRef<string | null>(null);
  
  // Reset clear code field when current error code actually changes
  useEffect(() => {
    const currentErrorCode = currentNonFieldError?.code || null;
    
    if (prevErrorCodeRef.current !== currentErrorCode) {
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
    

    // Start with existing clear codes from eraDto
    const existingClearCodes = eraDto?.clearCodes || [];

    if (!clearCodesInput.trim()) {
      // If no new clear codes input, return existing clear codes
      
      return existingClearCodes;
    }

    // Check if user entered 'C' or 'c' to clear current non-field error
    const trimmed = clearCodesInput.trim().toLowerCase();
    if (trimmed === "c" && currentNonFieldError) {
      const clearCode = currentNonFieldError.code;

      // Add new clear code to existing ones if not already present
      const updatedClearCodes = existingClearCodes.includes(clearCode)
        ? existingClearCodes
        : [...existingClearCodes, clearCode];

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
  const visibilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCloseoutRef = useRef<(() => Promise<void>) | null>(null);

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
  const generateNotesWithChanges = useCallback((action?: string) => {
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

    // Build action-specific note text
    let actionNote = "";
    if (action === "DELETED") {
      actionNote = "Record Deleted";
    } else if (action === "CLOSEOUT") {
      actionNote = "Record Closed Out";
    }

    // Create new note if there are changes, additional notes, or action-specific note
    if (fieldChanges.length > 0 || additionalNotes.trim() || actionNote) {
      const commentsObj = {
        ...(actionNote && { action: actionNote }),
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
  }, [currentUserSeid, formElements, originalFormElements, eraDto, getPayloadClearCodes, actionCode, errorItems, additionalNotes, notes]);

  const handleSuspend = async () => {
    if (!inventoryId || !actionCode.trim()) {
      setFlashMessage("Action Code is required for Suspend.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Validate only fields that have been changed by the user
    const changedFieldErrors = validateChangedFields();

    // Check for validation errors before suspending
    if (Object.keys(changedFieldErrors).length > 0) {
      setValidationErrors(changedFieldErrors);
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
            SEID: `${currentUserSeid}`,
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
            setInfoMessage(result.message || "Requires additional error correction");
            setShowInfo(true);
            setTimeout(() => setShowInfo(false), 10000);

            setFlashMessage(
              "Record sumbmitted for suspension"
            );
          } else {
            setFlashMessage("Record submitted for suspension");
          }

          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 4000);
        }
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      }
    } catch (error) {
      // setFlashMessage("Error suspending record. Please try again.");
      // setShowFlash(true);
      // setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSuspending(false);
    }
  };

  const handleCloseout = useCallback(async () => {

    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Set flag to prevent duplicate closeout calls from navigation events
    closeoutSentRef.current = true;

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
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
        // throw new Error(`Closeout failed: ${errorText}`);
      }
    } catch (error) {
      setFlashMessage("Error closing out record. Please try again.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setClosingOut(false);
    }
  }, [inventoryId, formElements, eraDto, currentUserSeid, router, isQrReviewer, isReopen]);

  // Update the ref whenever handleCloseout changes
  useEffect(() => {
    handleCloseoutRef.current = handleCloseout;
  }, [handleCloseout]);

  const handleDelete = async () => {
    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Validate only fields that have been changed by the user
    const changedFieldErrors = validateChangedFields();

    // Check for validation errors before deleting
    if (Object.keys(changedFieldErrors).length > 0) {
      setValidationErrors(changedFieldErrors);
      setFlashMessage("Please fix validation errors before deleting.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 5000);
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
              notes: generateNotesWithChanges("DELETED"),
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
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
        // throw new Error(`Delete failed: ${errorText}`);
      }
    } catch (error) {
      setFlashMessage("Error deleting record. Please try again.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!inventoryId) {
      setFlashMessage("No inventory ID available. Please return to home page.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
      return;
    }

    // Validate only fields that have been changed by the user
    // const validationErrors = validateChangedFields();
    const currentValidationErrors = validateChangedFields();

    // If there are validation errors, prevent submission and show errors
    if (Object.keys(currentValidationErrors).length > 0) {
      setValidationErrors(currentValidationErrors);
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
          } else if (isDlnSearch) {
            setFlashMessage(
              "Form submitted successfully. Returning to DLN search..."
            );
            setShowFlash(true);
            setTimeout(() => {
              const dln = eraDto?.dln || '';
              router.push(`/dln-search${dln ? `?dln=${encodeURIComponent(dln)}` : ''}`);
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
              setFlashMessage(
                "Form submitted successfully but failed to fetch new record"
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
            setFlashMessage(
              "Form submitted successfully but failed to fetch new record"
            );
          }

          setTimeout(() => setShowFlash(false), 4000);
        }
      } else {
        const errorText = await response.text();
        const error = JSON.parse(errorText);
        setFlashMessage(error.message);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 3000);
      }
    } catch (error) {
      setFlashMessage("Error submitting form. Please try again.");
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 3000);
    } finally {
      setSubmitting(false);
    }
  }, [inventoryId, eraDto, formElements, currentUserSeid, getPayloadClearCodes, generateNotesWithChanges, fieldWithErrors, isQrReviewer, isReopen, isDlnSearch, router, loadNextWorkRecord, convertEraDtoToFormElements, validateChangedFields]);

  // Add keyboard event handler for Page Up key to trigger handleSubmit
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      // Check if Page Up key is pressed (key code 33 or key name 'PageUp')
      if (event.key === "PageUp" || event.keyCode === 33) {
        event.preventDefault();
        

        // Only call handleSubmit if inventoryId is available and there are no field errors
        if (!inventoryId) {
          return;
        }

        if (hasAnyFieldErrors()) {
          setFlashMessage("Field errors need to be fixed for submission");
          setShowFlash(true);
          setTimeout(() => setShowFlash(false), 3000);
          return;
        }

        
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
    handleSubmit,
    hasAnyFieldErrors
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
      }, TIMEOUT_DURATION - WARNING_DURATION);

      // Set main timeout (10 minutes)
      timeoutRef.current = setTimeout(() => {
        setInfoMessage("Session timed out due to inactivity. Closing out record...");
        setShowInfo(true);
        
        // Trigger closeout after a brief delay to show the message
        setTimeout(() => {
          if (handleCloseoutRef.current) {
            handleCloseoutRef.current();
          }
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
  }, []); // Empty dependency array - timeout logic should not reset on re-renders

  // Ref to track if closeout has been sent (persists across renders)
  const closeoutSentRef = useRef(false);

  // Unified closeout function used by all event handlers
  const performCloseout = useCallback((source: string) => {
    if (closeoutSentRef.current || !inventoryId || !currentUserSeid) {
      
      return;
    }
    
    closeoutSentRef.current = true;
    

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
          if (response.status === 200) {
            // Don't navigate here - the browser event (beforeunload/pagehide/unmount) is already handling navigation
          }
          return response.text();
        })
        .then(data => {
        })
        .catch(error => {
        });
    } catch (error) {
    }
  }, [inventoryId, currentUserSeid]);

  // Browser event handlers for closeout (browser close, refresh, tab close)
  useEffect(() => {

    // Handle browser close, tab close, refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      performCloseout("beforeunload");
    };

    // Handle tab switching, browser minimization, window focus loss
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Start a timer to closeout after TIMEOUT_DURATION
        visibilityTimeoutRef.current = setTimeout(() => {
          performCloseout("visibilitychange");
        }, TIMEOUT_DURATION);
      } else {
        // Page became visible again - cancel the timeout
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
          visibilityTimeoutRef.current = null;
        }
      }
    };

    // Handle navigation away from page (fallback)
    const handlePageHide = (event: PageTransitionEvent) => {
      performCloseout("pagehide");
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    // document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [performCloseout]);

  // Component unmount handler for back button navigation
  // This is needed because Next.js App Router unmounts the component before popstate fires
  useEffect(() => {

    // Cleanup function runs when component unmounts (including back button navigation)
    return () => {
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
      setInfoMessage("Session timed out due to inactivity. Closing out record...");
      setShowInfo(true);
      setTimeout(() => {
        if (handleCloseoutRef.current) {
          handleCloseoutRef.current();
        }
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


      {/* Main Content Grid - 60% Form / 40% Side Panel */}
      <div id="main-content" className="grid grid-cols-1 lg:grid-cols-[1fr_0.67fr] gap-6 px-4 pb-4 min-h-[600px] max-w-full overflow-hidden">

        {/* ── Form Panel (Left 60%) ─────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-w-0 overflow-hidden">

          {/* Form Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-lg flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-800 tracking-tight">
              Form {eraDto?.workRecord?.formType || eraDto?.formType || "4868"} — {formDef.formName}
            </h3>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
              {(eraDto?.workRecord?.taxYr || eraDto?.workRecord?.TaxPeriodEndDt) && (
                <span>Tax Year: {eraDto?.workRecord?.taxYr || eraDto?.workRecord?.TaxPeriodEndDt?.slice(0, 4)}</span>
              )}
              {eraDto?.workRecord?.dln && (
                <span>DLN: {eraDto.workRecord.dln}</span>
              )}
            </div>
          </div>

          {/* Body: left side nav (multi-section) + section content */}
          <div className="flex flex-1 overflow-hidden">

          {/* Section Side Nav — shown only for multi-section forms */}
          {visibleSections.length > 1 && (
            <SectionSideNav
              items={visibleSections.map((s, i) => ({
                id: s.id,
                label: s.label,
                stepNumber: i + 1,
                errorCount: errorCountBySection[s.id] ?? 0,
              }))}
              activeId={effectiveActiveSectionId}
              onChange={setActiveSectionId}
              footerContent={
                (eraDto?.workRecord?.taxYr || eraDto?.workRecord?.TaxPeriodEndDt) ? (
                  <div>
                    <div>Tax year</div>
                    <div className="text-[15px] font-medium text-[#1a1a18] mt-0.5">
                      {eraDto?.workRecord?.taxYr || eraDto?.workRecord?.TaxPeriodEndDt?.slice(0, 4)}
                    </div>
                  </div>
                ) : undefined
              }
            />
          )}

          {/* Section Content */}
          <div
            id={`section-panel-${effectiveActiveSectionId}`}
            role="tabpanel"
            className="flex-1 overflow-y-auto p-6"
          >
            {activeSection && (
              <form className="space-y-6">
                {/* Section title + instructions */}
                <div className="mb-2 pb-3 border-b-2 border-gray-200">
                  <h4 className="text-base font-bold text-gray-800 tracking-tight">
                    {visibleSections.length > 1
                      ? `${activeSection.label}: ${activeSection.title}`
                      : activeSection.title}
                  </h4>
                  {activeSection.instructions && (
                    <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                      {activeSection.instructions}
                    </p>
                  )}
                </div>

                {/* Inline Error Badges — errors for this section */}
                {activeSectionErrors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeSectionErrors.map((error) => (
                      <div
                        key={error.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleErrorClick(error)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleErrorClick(error);
                          }
                        }}
                        aria-label={`Error ${error.code}: ${error.description}`}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 ${
                          selectedErrorId === error.id
                            ? "bg-red-100 text-red-800 border border-red-300 shadow-sm"
                            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300"
                        }`}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-70" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {error.code} — {error.description}
                      </div>
                    ))}
                  </div>
                )}

                {/* Clear Codes — visible when current section has a clearable error */}
                <div className="grid grid-cols-1 gap-4">
                  <FormField label="Clear Codes" required={false} htmlFor="clearCodesInput">
                    <FormInput
                      id="clearCodesInput"
                      value={clearCodesInput}
                      onChange={(value) => {
                        const filteredValue = value.replace(/[^Cc]/g, "");
                        setClearCodesInput(filteredValue.slice(0, 1));
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
                  </FormField>
                </div>

                {/* Editable Fields */}
                {activeSectionEditableKeys.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSectionEditableKeys.map((key) => {
                      const lineNum = getLineNumber(key);
                      const label = lineNum
                        ? `${lineNum}. ${getFormElementLabel(key)}`
                        : getFormElementLabel(key);
                      return (
                        <FormField
                          key={key}
                          label={label}
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
                      );
                    })}
                  </div>
                )}

                {/* Non-Editable Fields */}
                {activeSectionNonEditableKeys.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 border-b border-gray-100 pb-1">
                      Reference Fields
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeSectionNonEditableKeys.map((key) => {
                        const lineNum = getLineNumber(key);
                        const label = lineNum
                          ? `${lineNum}. ${getFormElementLabel(key)}`
                          : getFormElementLabel(key);
                        return (
                          <FormField
                            key={key}
                            label={label}
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
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Code */}
                <div className="pt-2 border-t border-gray-100">
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
                        <option key={suspenseCode.code} value={suspenseCode.code}>
                          {suspenseCode.code} - {suspenseCode.description} (
                          {suspenseCode.daysSuspended} days)
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>
                </div>
              </form>
            )}
          </div>
          </div>{/* end flex body row */}
        </div>

        {/* ── Side Panel (Right 40%) ────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full min-w-0 overflow-hidden">

          {/* Tab Strip */}
          <div className="flex border-b border-gray-200 flex-shrink-0" role="tablist">
            <button
              role="tab"
              aria-selected={activeRightTab === "errors"}
              onClick={() => setActiveRightTab("errors")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00599c] ${
                activeRightTab === "errors"
                  ? "border-[#00599c] text-[#00599c]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Error Details
              {selectedError && (
                <span className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeRightTab === "notes"}
              onClick={() => setActiveRightTab("notes")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#00599c] ${
                activeRightTab === "notes"
                  ? "border-[#00599c] text-[#00599c]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Notes
              {notes.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-gray-200 text-gray-600 rounded-full">
                  {notes.length}
                </span>
              )}
            </button>
          </div>

          {/* Error Details Tab */}
          {activeRightTab === "errors" && (
            <div className="flex-1 overflow-y-auto p-6">
              {selectedError ? (
                <div className="space-y-4">
                  {/* Error header */}
                  <div className="pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base font-bold text-gray-800 font-mono">
                        {selectedError.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        selectedError.isFieldError
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {selectedError.isFieldError ? "Field Error" : "Consistency"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-snug">
                      {selectedError.description}
                    </p>
                  </div>

                  {/* Affected fields */}
                  {selectedError.errorFields && selectedError.errorFields.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Affected Fields
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedError.errorFields.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 font-mono"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IRM guidance */}
                  {selectedError.irm && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-bold text-blue-800">
                        {selectedError.irm.title}
                      </p>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        {selectedError.irm.content}
                      </p>
                      {selectedError.irm.steps && selectedError.irm.steps.length > 0 && (
                        <ol className="list-decimal list-inside space-y-1">
                          {selectedError.irm.steps.map((step, i) => (
                            <li key={i} className="text-xs text-blue-700 leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <svg
                    className="w-10 h-10 text-gray-300 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-gray-400">
                    Select an error badge above to see details and resolution steps
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeRightTab === "notes" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-6">
              {/* Additional Notes Input */}
              <div className="mb-4 flex-shrink-0">
                <label
                  htmlFor="additionalNotesTextarea"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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

              <div className="flex-1 overflow-y-auto space-y-4">
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
                            let parsedComments = note.comments;
                            if (typeof note.comments === "string") {
                              try {
                                parsedComments = JSON.parse(note.comments);
                              } catch {
                                parsedComments = note.comments;
                              }
                            }

                            if (typeof parsedComments === "string") {
                              return (
                                <div className="note-comments">
                                  <div className="text-sm text-gray-700 whitespace-pre-line">
                                    {parsedComments}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="note-comments">
                                {parsedComments.action && (
                                  <div className="action-note mb-3">
                                    <div className="text-sm font-semibold text-red-600">
                                      {parsedComments.action}
                                    </div>
                                  </div>
                                )}
                                {parsedComments.errorsBeingCorrected &&
                                  parsedComments.errorsBeingCorrected.length > 0 && (
                                    <div className="errors-being-corrected mb-2">
                                      <div className="text-sm font-medium text-gray-600 mb-1">
                                        Error(s) Shown:
                                      </div>
                                      <div className="text-sm text-gray-700 ml-4">
                                        {parsedComments.errorsBeingCorrected.join(", ")}
                                      </div>
                                    </div>
                                  )}
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
                              </div>
                            );
                          } catch (error) {
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
          )}
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
