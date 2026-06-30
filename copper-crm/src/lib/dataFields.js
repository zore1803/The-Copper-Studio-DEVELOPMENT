// Central registry of workspace-configurable dropdown option lists. The lists
// here used to live as hardcoded constants scattered across the company,
// contact, project, payment and document modules — now they are managed from
// Settings > Data Fields and persisted server-side (Settings.dataFields).
//
// Every consumer reads the merged values via `useDataFields()` (or
// `getDataField(key)` for non-React code), so editing a list in Settings
// instantly updates the dropdown everywhere it is used.

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "./api";
import {
  INDUSTRIES,
  LEAD_SOURCES,
  INDIAN_CITIES,
} from "./companyOptions";
import { PROJECT_TEMPLATES } from "./projectDefaults";

const PROJECT_DELIVERY_STAGES = [
  "Pending", "Confirmed", "Requirement Gathering", "Design", "Development",
  "Testing", "Review", "Deployment", "Completed", "Cancelled", "On Hold",
];

// Canonical default option lists, seeded from the values that were previously
// hardcoded in each module so nothing changes until an admin edits a list.
export const DEFAULT_DATA_FIELDS = {
  companyIndustry: INDUSTRIES,
  companyStatus: ["Active", "Prospect", "Inactive"],
  companyOwner: [],
  leadSource: LEAD_SOURCES,
  companyCity: INDIAN_CITIES,
  contactStatus: ["Active", "Inactive", "Prospect", "Lead", "Archived"],
  companyRoles: ["Decision maker", "Primary contact", "Billing contact", "Technical contact"],
  paymentMethod: ["UPI", "Card", "Netbanking", "Wallet", "Bank Transfer"],
  paymentGateway: ["Razorpay", "Stripe", "Manual"],
  paymentStatusPayments: ["Success", "Pending", "Failed", "Refunded"],
  paymentStatusProjects: ["Pending", "Partial", "Paid", "Overdue"],
  projectTemplate: Object.keys(PROJECT_TEMPLATES),
  projectDeliveryStage: PROJECT_DELIVERY_STAGES,
  projectTaskStatus: ["To Do", "In Progress", "Review", "Done"],
  documentCategory: ["Contracts", "Invoices", "Proposals", "Design Files", "Source Code", "Deliverables"],
  documentFileType: ["pdf", "doc", "docx", "xlsx", "png", "jpg", "zip"],
};

// UI metadata for the Settings > Data Fields editor, grouped by module.
export const DATA_FIELD_GROUPS = [
  {
    label: "Company",
    fields: [
      { key: "companyIndustry", label: "Company Industry Type", hint: "Industry options on the company form." },
      { key: "companyStatus", label: "Company Status", hint: "Lifecycle status shown on companies." },
      { key: "companyOwner", label: "Company Owner / Project Manager", hint: "Names shown in the owner and project manager dropdowns." },
      { key: "companyCity", label: "Company City", hint: "City shortlist on the company form." },
      { key: "leadSource", label: "Lead Source", hint: "Where the lead originated." },
      { key: "companyRoles", label: "Company Roles", hint: "Contact role labels." },
    ],
  },
  {
    label: "Contacts",
    fields: [
      { key: "contactStatus", label: "Contact Status", hint: "Status options on the contact form." },
    ],
  },
  {
    label: "Payments",
    fields: [
      { key: "paymentMethod", label: "Payment Method", hint: "How a payment was made." },
      { key: "paymentGateway", label: "Payment Gateway", hint: "Gateways used at checkout." },
      { key: "paymentStatusPayments", label: "Payment Status — Payments module", hint: "Status used in the Payments list." },
      { key: "paymentStatusProjects", label: "Payment Status — Projects module", hint: "Status used on project records." },
    ],
  },
  {
    label: "Projects",
    fields: [
      { key: "projectTemplate", label: "Project Template", hint: "Templates that seed the delivery roadmap." },
      { key: "projectDeliveryStage", label: "Project Delivery Stage", hint: "Stages a project moves through." },
      { key: "projectTaskStatus", label: "Project Task Status", hint: "Kanban columns / task statuses." },
    ],
  },
  {
    label: "Documents",
    fields: [
      { key: "documentCategory", label: "Document Category", hint: "Folders documents are filed under." },
      { key: "documentFileType", label: "Document File Type", hint: "File-type options when adding a document." },
    ],
  },
];

export const DATA_FIELD_KEYS = DATA_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

// Merge stored values over the canonical defaults, dropping empty/invalid lists
// so a partially-saved document never blanks out a dropdown.
export function mergeDataFields(stored) {
  const merged = { ...DEFAULT_DATA_FIELDS };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(DEFAULT_DATA_FIELDS)) {
      const value = stored[key];
      if (Array.isArray(value)) merged[key] = value;
    }
  }
  return merged;
}

// --- Module-level cache so every component shares one fetch -------------------
let cache = null;
let inflight = null;
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener(cache);
}

export function getDataFields() {
  return cache || DEFAULT_DATA_FIELDS;
}

export function getDataField(key) {
  return getDataFields()[key] || DEFAULT_DATA_FIELDS[key] || [];
}

// Fetch the lists once and populate the cache. Safe to call repeatedly.
export function primeDataFields(token) {
  if (cache || inflight) return inflight || Promise.resolve(cache);
  inflight = apiGet("/api/admin/settings/data-fields", token)
    .then((data) => {
      cache = mergeDataFields(data?.dataFields);
      emit();
      return cache;
    })
    .catch(() => {
      cache = { ...DEFAULT_DATA_FIELDS };
      emit();
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

// Persist edited lists and refresh the cache.
export async function saveDataFields(values, token) {
  const data = await apiPut("/api/admin/settings/data-fields", { dataFields: values }, token);
  cache = mergeDataFields(data?.dataFields);
  emit();
  return cache;
}

// React hook — returns the merged lists, triggering a fetch on first use.
export function useDataFields(token) {
  const [fields, setFields] = useState(() => getDataFields());
  useEffect(() => {
    const listener = (next) => setFields(next || DEFAULT_DATA_FIELDS);
    listeners.add(listener);
    if (cache) setFields(cache);
    else primeDataFields(token);
    return () => listeners.delete(listener);
  }, [token]);
  return fields;
}
