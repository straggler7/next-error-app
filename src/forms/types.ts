// ─── Field Types ──────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "currency"    // $ amounts — formatted with decimal places
  | "integer"     // whole numbers
  | "ssn"         // ###-##-#### display
  | "ein"         // ##-####### display
  | "date"        // YYYY-MM-DD
  | "taxPeriod"   // YYYYMM
  | "checkbox"
  | "radio"
  | "select"
  | "calculated"  // read-only, derived from formula
  | "textarea";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  required?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  messages: Record<string, string>;
}

export interface FieldCondition {
  fieldId: string;
  operator: "eq" | "neq" | "truthy" | "falsy" | "in";
  value?: string | string[];
}

// ─── Field ────────────────────────────────────────────────────────────────────

export interface FieldDef {
  id: string;                   // unique within form — matches API payload key
  label: string;
  type: FieldType;
  editable: boolean;
  lineNumber?: string;          // IRS line number: "3", "4e", "16a" — shown next to label
  span?: 1 | 2;                 // grid column span (default 1)
  options?: SelectOption[];     // for select / radio / checkbox
  formula?: string;             // calculated: "part2.totalPayments - part2.subtotal"
  dependsOn?: string[];         // field IDs watched for recalculation
  helpText?: string;            // inline hint text
  validation?: FieldValidation;
  condition?: FieldCondition;   // render only when condition is true
}

// ─── Section ──────────────────────────────────────────────────────────────────

export type SectionType = "part" | "schedule" | "header-only";

export interface SectionDef {
  id: string;                   // "part1", "part2", "scheduleA"
  type: SectionType;
  label: string;                // tab label: "Part 1", "Schedule A"
  title: string;                // full title: "Tell Us About Your Return"
  instructions?: string;        // shown below section title (collapsible)
  fields: FieldDef[];
  condition?: FieldCondition;   // show section only when condition is met
  subsections?: SectionDef[];   // nested parts within a section
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export type ErrorCategory =
  | "field"
  | "consistency"
  | "math"
  | "identity"
  | "system";

export interface IrmReference {
  cite: string;      // "IRM 3.12.32.6.3"
  title: string;
  content: string;
  steps?: string[];
}

export interface ErrorDef {
  code: string;
  description: string;
  category: ErrorCategory;
  clearable: boolean;
  clearCode?: string;           // default "C"
  sectionId?: string;           // which section tab this error belongs to
  affectedFieldIds: string[];   // field IDs within this form
  irm?: IrmReference;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export type FormSeries = "4868" | "94X" | "1040" | "1120" | "1065";

export interface FormDef {
  formId: string;               // "940", "941", "1040", "4868"
  formName: string;
  series: FormSeries;
  entityType: "individual" | "employer" | "business" | "partnership";
  sections: SectionDef[];       // ordered list — drives tab navigation
  errors: ErrorDef[];
}
