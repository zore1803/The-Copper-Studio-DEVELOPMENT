const KEYS = {
  companies: "cs_companies",
  contacts: "cs_contacts",
  leads: "cs_leads",
  deals: "cs_deals",
  tasks: "cs_tasks",
  meetings: "cs_meetings",
  projects: "cs_projects",
  documents: "cs_documents",
  emailTemplates: "cs_email_templates",
  whatsappTemplates: "cs_whatsapp_templates",
  payments: "cs_payments",
  proposals: "cs_proposals",
  orders: "cs_orders",
  coupons: "cs_coupons",
  invoices: "cs_invoices",
  profile: "cs_profile",
};

const STORE_VERSION_KEY = "cs_store_version";
const CURRENT_STORE_VERSION = "db-sync-v2";

function migrateStore() {
  try {
    if (localStorage.getItem(STORE_VERSION_KEY) === CURRENT_STORE_VERSION) return;
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(STORE_VERSION_KEY, CURRENT_STORE_VERSION);
  } catch {}
}

function adminStatusToClient(status, progress) {
  if (progress >= 100 || status === "Completed") return "completed";
  if (status === "On Hold") return "on_hold";
  if (!progress || progress === 0) return "not_started";
  return "in_progress";
}

export function generateStages(p) {
  if (p.stages && p.stages.length) return p.stages;
  const milestones = [
    { name: "Requirement Gathering", threshold: 10 },
    { name: "Design", threshold: 25 },
    { name: "Development", threshold: 50 },
    { name: "Testing", threshold: 75 },
    { name: "Review", threshold: 90 },
    { name: "Delivery", threshold: 100 },
  ];
  return milestones.map((m, i) => {
    const prev = i === 0 ? 0 : milestones[i - 1].threshold;
    if ((p.progress || 0) >= m.threshold) return { name: m.name, status: "completed" };
    if ((p.progress || 0) > prev) return { name: m.name, status: "in_progress" };
    return { name: m.name, status: "not_started" };
  });
}

export function enrichProject(p) {
  return {
    ...p,
    _id: p._id || String(p.id),
    id: p.id || p._id,
    packageName: p.packageName || p.packagePurchased || "Studio Package",
    expectedEndDate: p.expectedEndDate || p.dueDate || null,
    currentPhase: p.currentPhase || p.status || "In Progress",
    adminNotes: p.adminNotes !== undefined ? p.adminNotes : (p.note?.text || ""),
    clientStatus: p.clientStatus || adminStatusToClient(p.status, p.progress || 0),
    stages: generateStages(p),
    customFolders: p.customFolders || [],
  };
}

export function storeGet(type) {
  migrateStore();
  try {
    const raw = localStorage.getItem(KEYS[type]);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function storeSet(type, records) {
  migrateStore();
  try {
    localStorage.setItem(KEYS[type], JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("cs-store", { detail: { type } }));
  } catch {}
}

export function storeSave(type, record) {
  const records = storeGet(type);
  const id = record._id || record.id;
  const newId = id || `${type}-${Date.now()}`;
  const saved = { ...record, _id: newId, id: record.id || newId };
  // Match on _id and id independently (not the combined fallback value) so that
  // an optimistic local save (only `id` set) still gets replaced in place once
  // the server responds with a real `_id`, instead of creating a duplicate.
  const idx = records.findIndex(r =>
    (record._id && r._id === record._id) || (record.id && r.id === record.id)
  );
  const next = idx >= 0
    ? records.map((r, i) => (i === idx ? saved : r))
    : [saved, ...records];
  storeSet(type, next);
  return saved;
}

export function storeRemove(type, id) {
  storeSet(type, storeGet(type).filter(r => (r._id || r.id) !== id));
}

export function saveProject(projectData) {
  return storeSave("projects", enrichProject(projectData));
}

export function storeReset(type) {
  try { localStorage.removeItem(KEYS[type]); } catch {}
  window.dispatchEvent(new CustomEvent("cs-store", { detail: { type } }));
}
