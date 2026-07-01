import { useMemo, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "./ui";
import SidePanel from "./SidePanel";
import { useToast } from "./useToast";

// Single, shared "Upload Document" form used across every module (Document Center,
// a company's Documents tab, …) so the upload experience is identical everywhere.
// When a fixed `company` (and optionally `project`) is passed, the destination is
// locked and shown read-only; otherwise the company/project pickers are shown.

const DOCUMENT_CATEGORIES = ["Contracts", "Invoices", "Proposals", "Design Files", "Source Code", "Deliverables"];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const FILE_TYPES = ["pdf", "doc", "docx", "xlsx", "png", "jpg", "zip"];

function fileExt(filename) {
  const parts = String(filename || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function readFileAsDataUrl(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (onProgress && event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    reader.onload = () => { onProgress?.(100); resolve(reader.result); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DocumentUploadPanel({
  company = null,
  companies = [],
  projects = [],
  defaultCompanyId = "",
  defaultProjectId = "",
  defaultCategory = "",
  onClose,
  onSave,
}) {
  const { showToast } = useToast();
  const lockedCompanyId = company ? String(company._id || company.id) : "";
  const [form, setForm] = useState({
    companyId: lockedCompanyId || defaultCompanyId || "",
    projectId: defaultProjectId || "",
    name: "",
    category: defaultCategory || "Contracts",
    fileType: "pdf",
    fileUrl: "",
    fileSize: "",
    notes: "",
  });
  const [fileReady, setFileReady] = useState(false);
  const [reading, setReading] = useState(false);
  const [readPct, setReadPct] = useState(0);
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const nameOf = (c) => c.companyName || c.name || "Unnamed company";
  const companyProjects = useMemo(
    () => projects.filter((p) => String(p.companyId) === String(form.companyId)),
    [projects, form.companyId]
  );
  
  const isCustomCategory = Boolean(form.category.trim() && !DOCUMENT_CATEGORIES.includes(form.category.trim()));

  async function handleBrowse(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast({ type: "error", title: "File too large", message: "Files must be 8 MB or smaller. Paste a hosted file URL instead for larger files." });
      event.target.value = "";
      return;
    }
    setFileReady(false);
    setReadPct(0);
    setReading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file, setReadPct);
      setForm((prev) => ({
        ...prev,
        name: prev.name || file.name,
        fileType: fileExt(file.name) || prev.fileType,
        fileUrl: dataUrl,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      }));
      setFileReady(true);
    } finally {
      setReading(false);
      event.target.value = "";
    }
  }

  async function handleSave() {
    if (saving) return;
    if (!form.name.trim() || !form.companyId) return;
    if (isCustomCategory && !form.projectId) {
      showToast({ type: "error", title: "Project required", message: "When creating a new custom category, you must select a project folder for the document." });
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      showToast({ type: "error", title: "Upload failed", message: err?.message || "Could not upload the document. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SidePanel
      title="Upload Document"
      subtitle={company ? `Attach a file to ${company.name}.` : "Choose which company and project folder this document belongs to."}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || !form.companyId || reading || saving || (isCustomCategory && !form.projectId)}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Save Document</>}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Destination — where the document will be filed. */}
        <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">Destination folder</p>
          {company ? (
            <div className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm">
              <span className="text-[#6b7280]">Company:</span> <span className="font-semibold text-[#111827]">{company.name}</span>
            </div>
          ) : (
            <label className="block">
              <span className="text-xs font-semibold text-[#374151]">Company *</span>
              <select
                value={form.companyId}
                onChange={(e) => setForm((prev) => ({ ...prev, companyId: e.target.value, projectId: "" }))}
                className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
              >
                <option value="">Select a company…</option>
                {companies.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{nameOf(c)}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block">
            <span className="text-xs font-semibold text-[#374151]">Project folder</span>
            <select
              value={form.projectId}
              onChange={(e) => set("projectId")(e.target.value)}
              disabled={!form.companyId}
              className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
            >
              <option value="">Company level (no specific project)</option>
              {companyProjects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.name || p.projectName || "Untitled project"}</option>
              ))}
            </select>
            <span className="mt-1 block text-[11px] text-[#9ca3af]">
              {!form.companyId
                ? "Pick a company first to choose its project folder."
                : form.projectId
                  ? "Filed inside this project's folder."
                  : "Filed at the company level (not inside any project folder)."}
            </span>
          </label>
        </div>

        {/* File */}
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">File *</span>
          <div className="mt-1.5 rounded-lg border border-dashed border-[#d8c2b9] bg-[#fff8f6] px-3 py-3">
            <div className="flex items-center gap-3">
              <input id="shared-doc-browse" type="file" className="hidden" onChange={handleBrowse} disabled={reading || saving} />
              <label
                htmlFor="shared-doc-browse"
                className={`rounded-lg bg-[#884c2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f381a] ${reading || saving ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
              >
                Browse…
              </label>
              <span className="truncate text-xs text-[#6b7280]">{fileReady ? `${form.name} (${form.fileSize})` : reading ? "Reading file…" : "No file selected"}</span>
            </div>
            {reading && (
              <div className="mt-2.5">
                <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">
                  <span>Reading file</span><span>{readPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f1d9cd]">
                  <div className="h-full rounded-full bg-[#884c2d] transition-all" style={{ width: `${readPct}%` }} />
                </div>
              </div>
            )}
            {saving && (
              <div className="mt-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#884c2d]">
                  <Loader2 size={11} className="animate-spin" /> Uploading to server…
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f1d9cd]">
                  <div className="upload-indeterminate h-full w-1/3 rounded-full bg-[#884c2d]" />
                </div>
              </div>
            )}
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">File name *</span>
          <input value={form.name} onChange={(e) => set("name")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Category</span>
          <input
            list="doc-categories"
            value={form.category}
            onChange={(e) => set("category")(e.target.value)}
            placeholder="Select or type a custom category…"
            className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
          />
          <datalist id="doc-categories">
            {DOCUMENT_CATEGORIES.map((category) => <option key={category} value={category} />)}
          </datalist>
          {isCustomCategory && !form.projectId && (
            <span className="mt-1 block text-[11px] font-semibold text-amber-600">A project must be selected for custom categories.</span>
          )}
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">File type</span>
          <select value={form.fileType} onChange={(e) => set("fileType")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20">
            {FILE_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">…or paste a file URL</span>
          <input
            value={fileReady ? "" : form.fileUrl}
            onChange={(e) => set("fileUrl")(e.target.value)}
            disabled={fileReady}
            className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
          />
          <span className="mt-1 block text-[11px] text-[#9ca3af]">Link to an already-hosted file (Drive, S3, etc.) — only used if you don't browse a file above.</span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Notes</span>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
          />
        </label>
      </div>
    </SidePanel>
  );
}
