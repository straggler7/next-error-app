import type { FormDef, SectionDef, FieldDef } from "./types";
import { form4868 } from "./definitions/form4868";
import { form940 } from "./definitions/form940";

// ─── Registry ─────────────────────────────────────────────────────────────────
// Add new form definitions here. The key is the formId from the API payload.

const registry = new Map<string, FormDef>([
  ["4868", form4868],
  ["940", form940],
]);

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the form definition for a given formId, defaulting to 4868 if not found. */
export function getFormDef(formId: string): FormDef {
  return registry.get(formId) ?? form4868;
}

/** Returns a flat list of all fields across all sections (and subsections) of a form. */
export function getAllSectionFields(formDef: FormDef): FieldDef[] {
  return formDef.sections.flatMap((section) => getSectionAllFields(section));
}

/** Returns all fields in a section including any subsection fields. */
export function getSectionAllFields(section: SectionDef): FieldDef[] {
  return [
    ...section.fields,
    ...(section.subsections?.flatMap((sub) => sub.fields) ?? []),
  ];
}

/** Finds a field definition by its ID, searching all sections and subsections. */
export function getFieldDefById(
  formDef: FormDef,
  fieldId: string
): FieldDef | undefined {
  for (const section of formDef.sections) {
    const found = getSectionAllFields(section).find((f) => f.id === fieldId);
    if (found) return found;
  }
  return undefined;
}

/** Returns the error definition for a given error code. */
export function getErrorDef(formDef: FormDef, code: string) {
  return formDef.errors.find((e) => e.code === code);
}

/** Returns all registered form IDs. */
export function getRegisteredFormIds(): string[] {
  return Array.from(registry.keys());
}
