// Shared contact-name helper used by the Contacts list, Contact detail page,
// and the export menu — kept out of ContactExportMenu.jsx so that component
// file can stay component-only (required for React Fast Refresh).
export function contactFullName(contact) {
  return contact.name || `${contact.salutation || ""} ${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unnamed contact";
}
