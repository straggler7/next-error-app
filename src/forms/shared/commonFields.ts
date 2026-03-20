import type { FieldDef } from "../types";

// Reusable field factory functions — define once, compose across all form definitions.
// Each factory returns a FieldDef that can be overridden by the caller.

export const ssnField = (overrides?: Partial<FieldDef>): FieldDef => ({
  id: "primarySSN",
  label: "Taxpayer Identification Number (01TIN)",
  type: "ssn",
  editable: true,
  lineNumber: "01TIN",
  validation: {
    required: true,
    pattern: "^\\d{3}-?\\d{2}-?\\d{4}$",
    messages: {
      required: "Social Security Number is required",
      pattern: "SSN must be 9 digits (e.g., 123456789 or 123-45-6789)",
    },
  },
  ...overrides,
});

export const einField = (overrides?: Partial<FieldDef>): FieldDef => ({
  id: "ein",
  label: "Employer Identification Number",
  type: "ein",
  editable: false,
  validation: {
    required: true,
    pattern: "^\\d{2}-\\d{7}$",
    messages: {
      required: "EIN is required",
      pattern: "EIN must be ##-#######",
    },
  },
  ...overrides,
});

export const taxPeriodField = (overrides?: Partial<FieldDef>): FieldDef => ({
  id: "taxPrd",
  label: "Tax Period (01TXP)",
  type: "taxPeriod",
  editable: true,
  lineNumber: "01TXP",
  validation: {
    required: true,
    pattern: "^\\d{4}(0[1-9]|1[0-2])$",
    minLength: 6,
    maxLength: 6,
    messages: {
      required: "Tax Period is required",
      pattern: "Tax Period must be in YYYYMM format (e.g., 202301 for January 2023)",
      minLength: "Tax Period must be exactly 6 digits",
      maxLength: "Tax Period must be exactly 6 digits",
    },
  },
  ...overrides,
});

export const nameControlField = (overrides?: Partial<FieldDef>): FieldDef => ({
  id: "primaryNameCtrl",
  label: "Taxpayer Name Control (01NC)",
  type: "text",
  editable: true,
  lineNumber: "01NC",
  validation: {
    required: true,
    pattern: "^[A-Z0-9][A-Z0-9 &-]{0,3}$",
    minLength: 1,
    maxLength: 4,
    messages: {
      required: "Name Control is required",
      minLength: "Name Control must be at least 1 character",
      maxLength: "Name Control cannot exceed 4 characters",
      pattern: "Invalid Name Control format",
    },
  },
  ...overrides,
});

export const transactionDateField = (overrides?: Partial<FieldDef>): FieldDef => ({
  id: "meFReceiptDate",
  label: "Transaction Date (01TDT)",
  type: "date",
  editable: true,
  lineNumber: "01TDT",
  validation: {
    required: true,
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
    minLength: 10,
    maxLength: 10,
    messages: {
      required: "Transaction Date is required",
      pattern: "Transaction Date must be in YYYY-MM-DD format (e.g., 2023-01-15)",
      minLength: "Transaction Date must be exactly 10 characters",
      maxLength: "Transaction Date must be exactly 10 characters",
    },
  },
  ...overrides,
});
