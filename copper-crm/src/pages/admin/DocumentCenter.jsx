import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2, FileArchive, FileText, Folder, FolderOpen, Grid3X3,
  Link2, List, Loader2, Lock, Search, Share2, Upload, Users, Menu, X
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import DocumentUploadPanel from "../../components/DocumentUploadPanel";
import customFolderSvg from "../../assets/Folder.svg";
// Open a stored file in a new tab. Browsers block top-level navigation to big
// base64 data: URLs, so convert those to a Blob object URL first (that's why
// clicking "View" on an uploaded file did nothing). API endpoints and http(s)
// URLs open directly.
function openStoredFile(fileUrl) {
  if (!fileUrl) return;
  try {
    if (fileUrl.startsWith("data:")) {
      const [meta, base64] = fileUrl.split(",");
      const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "application/octet-stream";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      window.open(blobUrl, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } else {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const url = fileUrl.startsWith("/api/") ? `${base}${fileUrl}` : fileUrl;
      window.open(url, "_blank", "noopener");
    }
  } catch {
    window.open(fileUrl, "_blank", "noopener");
  }
}

const VISIBILITY = {
  private: { label: "Private", icon: Lock, className: "bg-gray-100 text-gray-600" },
  internal: { label: "Internal Team", icon: Users, className: "bg-blue-50 text-blue-700" },
  project: { label: "Project Team", icon: FolderOpen, className: "bg-amber-50 text-amber-700" },
  client: { label: "Client Visible", icon: Share2, className: "bg-emerald-50 text-emerald-700" },
};

const BASE_CATEGORIES = ["Contracts", "Invoices", "Proposals", "Design Files", "Source Code", "Deliverables", "Internal"];

const TYPE_ICON = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xlsx: FileText,
  ppt: FileText,
  zip: FileArchive,
  url: Link2,
};

function fileType(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext || "url";
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-xl border border-dashed border-[#E1E4EA] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-[#E1E4EA] text-[#525866]">
        <Folder size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>
    </div>
  );
}

function FolderCard({ icon: Icon, title, meta, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center justify-start rounded-xl p-3 text-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:-translate-y-1 will-change-transform ${active ? "bg-black/10 ring-1 ring-black/5" : "bg-transparent"}`}
    >
      {typeof Icon === "string" ? (
        <img src={Icon} alt="Folder" className="mb-3 h-[96px] w-auto object-contain drop-shadow-sm" />
      ) : (
        <div className={`mb-3 flex h-[96px] w-[96px] items-center justify-center text-[#525866] drop-shadow-sm`}>
          <Icon size={40} />
        </div>
      )}
      <p className="line-clamp-2 w-full text-[13px] font-medium leading-tight text-[#374151]">{title}</p>
      <p className="mt-0.5 w-full text-[11px] text-[#9ca3af]">{meta}</p>
    </button>
  );
}

// Whether a document is currently shared with the client. The admin-set
// `clientVisible` flag wins; legacy docs fall back to their visibility/scope.
function isClientVisible(doc) {
  return doc.clientVisible !== false
    && doc.visibility !== "internal"
    && doc.scope !== "internal"
    && doc.category !== "Internal";
}

function VisibilityToggle({ visible, busy, onChange }) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => { e.stopPropagation(); if (!busy) onChange(!visible); }}
      title={visible ? "Visible to the client — click to hide" : "Hidden from the client — click to share"}
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${busy ? "opacity-60 cursor-wait" : "cursor-pointer"} ${visible ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
    >
      <span className={`relative h-3.5 w-6 shrink-0 rounded-full transition-colors ${visible ? "bg-emerald-500" : "bg-gray-300"}`}>
        <span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${visible ? "left-[13px]" : "left-0.5"}`} />
      </span>
      {busy ? <Loader2 size={11} className="animate-spin" /> : (visible ? <Share2 size={11} /> : <Lock size={11} />)}
      {visible ? "Client Visible" : "Hidden"}
    </button>
  );
}

function DocumentRow({ doc, selected, onSelect, onToggle, busy, canToggle }) {
  const type = fileType(doc.fileName || doc.name || doc.storageUrl);
  const Icon = TYPE_ICON[type] || FileText;
  const visible = isClientVisible(doc);

  const dateStr = doc.createdAt || doc.date || doc.updatedAt;
  const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : "Unknown date";

  return (
    <div
      onClick={() => onSelect(doc)}
      className={`grid w-full grid-cols-[minmax(0,1.5fr)_120px_130px_120px_80px] gap-4 border-b border-[#f3f4f6] px-4 py-3 text-left text-sm hover:bg-[#fafafa] cursor-pointer ${selected ? "bg-[#fff8f6]" : "bg-white"}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6b7280]">
          <Icon size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-[#111827]">{doc.fileName || doc.name || "Untitled document"}</span>
          <span className="block truncate text-xs text-[#9ca3af]">{doc.tags?.join(", ") || doc.folderPath || "No tags"}</span>
        </span>
      </span>
      <span className="text-[#374151]">{type.toUpperCase()}</span>
      {canToggle ? (
        <VisibilityToggle visible={visible} busy={busy} onChange={(next) => onToggle(doc, next)} />
      ) : (
        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${visible ? VISIBILITY.client.className : VISIBILITY.private.className}`}>
          {visible ? <Share2 size={11} /> : <Lock size={11} />} {visible ? "Client Visible" : "Hidden"}
        </span>
      )}
      <span className="text-[#6b7280]">{formattedDate}</span>
      <span onClick={(e) => e.stopPropagation()}>
        {doc.fileUrl ? (
          <button
            type="button"
            onClick={() => openStoredFile(doc.fileUrl)}
            className="text-xs font-bold text-[#8D3118] hover:underline"
          >
            View
          </button>
        ) : (
          <span className="text-xs text-[#9ca3af]">No file</span>
        )}
      </span>
    </div>
  );
}


function FilesTable({ title, docs, selected, onSelect, onToggle, togglingId }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3">
        <div>
          <p className="text-sm font-bold text-[#111827]">{title}</p>
          <p className="text-xs text-[#6b7280]">{docs.length} documents</p>
        </div>
      </div>
      {docs.length ? (
        <div>
          <div className="grid grid-cols-[minmax(0,1.5fr)_120px_130px_120px_80px] gap-4 bg-[#fafafa] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
            <span>Name</span><span>Type</span><span>Visibility</span><span>Date</span><span>File</span>
          </div>
          {/* Documents scroll independently of the folders above. */}
          <div className="max-h-[220px] overflow-y-auto">
            {docs.map((doc, index) => (
              <DocumentRow
                key={doc._id || doc.id || `${doc.fileName}-${index}`}
                doc={doc}
                selected={selected === doc}
                onSelect={onSelect}
                onToggle={onToggle}
                canToggle={Boolean(onToggle)}
                busy={togglingId != null && String(togglingId) === String(doc._id || doc.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No documents yet." text="Upload documents to see them here." />
      )}
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#eef0f3] bg-[#f9fafb] px-4 py-3">
      <p className="text-xs text-[#9ca3af]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#111827] break-words">{value || "—"}</p>
    </div>
  );
}

function ProjectDetails({ project, company }) {
  const money = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v) || 0);
  const date = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—");
  const amount = Number(project.finalAmount ?? project.packageValue ?? project.budget ?? 0);
  const status = String(project.status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
      <h3 className="mb-4 text-base font-bold text-[#111827]">Project Information</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailCard label="Project ID" value={project.projectId} />
        <DetailCard label="Project Name" value={project.name} />
        <DetailCard label="Original Request" value={project.clientProjectName} />
        <DetailCard label="Company" value={company?.name || company?.companyName || project.companyName} />
        <DetailCard label="Package" value={project.packageName} />
        <DetailCard label="Amount" value={money(amount)} />
        <DetailCard label="Status" value={status} />
        <DetailCard label="Current Phase" value={project.currentPhase} />
        <DetailCard label="Created" value={date(project.createdAt)} />
        <DetailCard label="Expected Delivery" value={date(project.expectedEndDate)} />
      </div>
    </div>
  );
}

export default function DocumentCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCompanyId = searchParams.get("company");
  const selectedProjectId = searchParams.get("project");

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [projectTab, setProjectTab] = useState("details");
  const [togglingId, setTogglingId] = useState(null);
  const { records: companies } = useCrmRecords("companies");
  const { records: projects, save: saveProject } = useCrmRecords("projects");
  const { records: documents, save: saveDocument } = useCrmRecords("documents");
  const { records: invoices, save: saveInvoice } = useCrmRecords("invoices");

  const currentCompany = companies.find((c) => String(c.id) === String(selectedCompanyId) || String(c._id) === String(selectedCompanyId));
  const currentProject = projects.find((p) => String(p.id) === String(selectedProjectId) || String(p._id) === String(selectedProjectId));

  // Always land on the Details tab when opening a different project.
  useEffect(() => { setProjectTab("details"); setCategoryFilter("All"); }, [selectedProjectId, selectedCompanyId]);

  const projectDocs = useMemo(() => {
    // 1. Fetch from the documents collection where projectId is set
    const collectionDocs = documents
      .filter((doc) => doc.projectId)
      .map((doc) => {
        const project = projects.find((p) => String(p._id || p.id) === String(doc.projectId));
        return {
          ...doc,
          _source: "document",
          id: doc._id || doc.id,
          projectId: doc.projectId,
          companyId: doc.companyId || project?.companyId,
          projectName: project?.name || project?.projectName || "Project",
          visibility: doc.visibility || (doc.scope === "internal" ? "internal" : "client"),
          folderPath: `${project?.name || "Project"} / ${doc.category || "Files"}`,
          fileName: doc.fileName || doc.name,
          fileUrl: doc.fileUrl,
        };
      });

    // 2. Fetch from the embedded project.documents (fallback)
    const embeddedDocs = projects.flatMap((project) =>
      (project.documents || []).map((doc) => ({
        ...doc,
        _source: "embedded",
        id: doc._id || doc.id,
        projectId: project.id || project._id,
        companyId: project.companyId,
        projectName: project.name || project.projectName,
        visibility: doc.visibility || (doc.category === "Internal" ? "internal" : "client"),
        folderPath: `${project.name || "Project"} / ${doc.category || "Files"}`,
        fileName: doc.fileName || doc.name,
        fileUrl: doc.fileUrl,
      }))
    );

    // 3. Fetch from invoices (represented as PDF documents)
    const invoiceDocs = invoices.map((inv) => {
      // Try to find the matching project using the projectId or sourceOrderId
      const project = projects.find(
        (p) =>
          (inv.projectId && String(p._id || p.id) === String(inv.projectId)) ||
          (inv.sourceOrderId && p.orderId && String(p.orderId) === String(inv.sourceOrderId))
      );

      const pName = project?.name || project?.projectName || "Project";
      const pId = project?._id || project?.id;

      return {
        _source: "invoice",
        _id: inv._id || inv.id,
        id: inv._id || inv.id,
        name: `Tax Invoice - ${inv.invoiceNumber || inv.id}.pdf`,
        fileName: `Tax Invoice - ${inv.invoiceNumber || inv.id}.pdf`,
        fileType: "pdf",
        category: "Invoices",
        tags: ["Invoice", "Receipt"],
        projectId: pId,
        companyId: inv.companyId || project?.companyId,
        projectName: pName,
        clientVisible: inv.clientVisible,
        visibility: inv.clientVisible === false ? "internal" : "client",
        folderPath: `${pName} / Invoices`,
        // HTML view is instant and reliable; the /pdf endpoint uses Chromium and
        // fails on cold starts. The invoice page prints to PDF from the browser.
        fileUrl: `/api/invoices/${inv._id || inv.id || inv.invoiceNumber}/html`,
        createdAt: inv.createdAt || inv.date || inv.paidAt,
      };
    });

    return [...collectionDocs, ...embeddedDocs, ...invoiceDocs];
  }, [projects, documents, invoices]);

  const normalizedQuery = query.trim().toLowerCase();
  const filterDoc = (doc) => {
    if (categoryFilter !== "All" && doc.category !== categoryFilter) return false;
    if (!normalizedQuery) return true;
    const haystack = `${doc.fileName || ""} ${doc.folderPath || ""} ${doc.tags?.join(" ") || ""}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  };

  // Pure company-level documents = the documents collection rows that aren't
  // tied to a project (so they don't double-count with projectDocs).
  const directCompanyDocs = (companyId) =>
    documents
      .filter((d) => !d.projectId && String(d.companyId) === String(companyId))
      .map((doc) => ({ ...doc, id: doc._id || doc.id, projectName: "Company", folderPath: "Company Files", fileName: doc.fileName || doc.name }));

  // Every document belonging to a company: all its projects' files + invoices
  // (projectDocs) plus its direct company files.
  const allDocsForCompany = (companyId) =>
    [...projectDocs.filter((d) => String(d.companyId) === String(companyId)), ...directCompanyDocs(companyId)];

  const mode = !selectedCompanyId ? "root" : (!selectedProjectId ? "company" : "project");

  let displayFolders = [];
  let displayFiles = [];
  let viewTitle = "";
  let viewSubtitle = "";

  if (mode === "root") {
    displayFolders = companies.map((company) => {
      const cid = company._id || company.id;
      const companyProjects = projects.filter((p) => String(p.companyId) === String(cid));
      return {
        id: cid,
        icon: customFolderSvg,
        title: company.companyName || company.name || "Unnamed company",
        meta: `${companyProjects.length} projects · ${allDocsForCompany(cid).length} files`,
        type: "company"
      };
    });
    if (normalizedQuery) displayFolders = displayFolders.filter((f) => f.title.toLowerCase().includes(normalizedQuery));
    viewTitle = "Company Folders";
    viewSubtitle = "All documents grouped by company. Open a company to see everything; open a project for its details and files.";
  } else if (mode === "company") {
    const companyProjects = projects.filter((p) => String(p.companyId) === String(selectedCompanyId));
    displayFolders = companyProjects.map((project) => ({
      id: project._id || project.id,
      icon: customFolderSvg,
      title: project.name || project.projectName || "Unnamed project",
      meta: `${projectDocs.filter((d) => String(d.projectId) === String(project._id || project.id)).length} items`,
      type: "project"
    }));
    if (normalizedQuery) displayFolders = displayFolders.filter((f) => f.title.toLowerCase().includes(normalizedQuery));
    displayFiles = allDocsForCompany(selectedCompanyId).filter(filterDoc);

    viewTitle = currentCompany?.companyName || currentCompany?.name || "Company";
    viewSubtitle = `All documents for ${viewTitle}`;
  } else {
    // Project level: details + that project's documents only.
    displayFiles = projectDocs.filter((d) => String(d.projectId) === String(selectedProjectId)).filter(filterDoc);
    viewTitle = currentProject?.name || currentProject?.projectName || "Project";
    viewSubtitle = currentCompany?.name || currentCompany?.companyName || "";
  }

  const availableCategories = useMemo(() => {
    let rawDocs = [];
    if (mode === "company") {
      const pDocs = projectDocs.filter((d) => String(d.companyId) === String(selectedCompanyId));
      const cDocs = documents
        .filter((d) => !d.projectId && String(d.companyId) === String(selectedCompanyId))
        .map((doc) => ({ ...doc, id: doc._id || doc.id, projectName: "Company", folderPath: "Company Files", fileName: doc.fileName || doc.name }));
      rawDocs = [...pDocs, ...cDocs];
    } else if (mode === "project") {
      rawDocs = projectDocs.filter((d) => String(d.projectId) === String(selectedProjectId));
    }
    
    const dynamicCats = rawDocs.map((d) => d.category).filter(Boolean);
    return Array.from(new Set([...BASE_CATEGORIES, ...dynamicCats])).sort();
  }, [mode, selectedCompanyId, selectedProjectId, projectDocs, documents]);

  const showFolders = mode === "root" || mode === "company";

  function handleFolderClick(folder) {
    setQuery("");
    if (folder.type === "company") {
      setSearchParams({ company: folder.id });
    } else if (folder.type === "project") {
      setSearchParams({ company: selectedCompanyId, project: folder.id });
    }
  }

  async function handleUpload(form) {
    // Destination now comes from the form's own company/project selectors, so a
    // document can be filed anywhere — not just the folder currently open.
    const payload = { ...form, name: form.name };
    if (!payload.companyId) delete payload.companyId;
    if (!payload.projectId) delete payload.projectId;
    await saveDocument(payload);
    setUploading(false);
  }

  // Flip a document's client-portal visibility. Each document source lives in a
  // different collection, so we persist the change to the right record.
  async function handleToggleVisibility(doc, nextVisible) {
    const docId = doc._id || doc.id;
    setTogglingId(docId);
    try {
      if (doc._source === "invoice") {
        const inv = invoices.find((i) => String(i._id || i.id) === String(docId));
        if (inv) await saveInvoice({ ...inv, clientVisible: nextVisible });
      } else if (doc._source === "embedded") {
        const project = projects.find((p) => String(p._id || p.id) === String(doc.projectId));
        if (project) {
          const updatedDocs = (project.documents || []).map((d) =>
            String(d._id || d.id) === String(docId)
              ? { ...d, clientVisible: nextVisible, visibility: nextVisible ? "client" : "internal" }
              : d
          );
          await saveProject({ ...project, documents: updatedDocs });
        }
      } else {
        const rec = documents.find((d) => String(d._id || d.id) === String(docId));
        if (rec) {
          await saveDocument({
            ...rec,
            clientVisible: nextVisible,
            visibility: nextVisible ? "client" : "internal",
            scope: nextVisible ? "client_shared" : "internal",
          });
        }
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#FFFFFF]">
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-xs text-[#9ca3af]">
            <button type="button" onClick={() => setSearchParams({})} className="font-medium hover:text-[#8D3118]">Companies</button>
            {selectedCompanyId && (
              <>
                <span>/</span>
                <button type="button" onClick={() => setSearchParams({ company: selectedCompanyId })} className="font-medium hover:text-[#8D3118] truncate max-w-[180px]">
                  {currentCompany?.name || currentCompany?.companyName || "Company"}
                </button>
              </>
            )}
            {selectedProjectId && (
              <>
                <span>/</span>
                <span className="font-medium text-[#374151] truncate max-w-[200px]">{currentProject?.name || "Project"}</span>
              </>
            )}
          </nav>
          <h1 className="mt-0.5 text-base font-medium text-[#0E121B] truncate">{viewTitle}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode !== "root" && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#374151] outline-none focus:border-[#8D3118] focus:ring-2 focus:ring-[#8D3118]/20"
            >
              <option value="All">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <div className="flex h-9 w-full items-center gap-2 rounded-full border border-[#E1E4EA] bg-white px-3 sm:w-64">
            <Search size={14} className="text-[#525866] shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents" className="w-full bg-transparent text-sm outline-none placeholder:text-[#525866]" />
          </div>
          <button onClick={() => setView("grid")} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${view === "grid" ? "border-[#8D3118] text-[#8D3118]" : "border-[#e5e7eb] text-[#6b7280]"}`}><Grid3X3 size={15} /></button>
          <button onClick={() => setView("list")} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${view === "list" ? "border-[#8D3118] text-[#8D3118]" : "border-[#e5e7eb] text-[#6b7280]"}`}><List size={15} /></button>
          <Button onClick={() => setUploading(true)}><Upload size={14} /> Upload</Button>
        </div>
      </div>

      <section className="min-w-0 flex-1 p-5 xl:p-6">
        {showFolders && displayFolders.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#111827]">{!selectedCompanyId ? "Companies" : "Projects"}</h2>
              <span className="text-xs font-medium text-[#9ca3af]">{displayFolders.length} {displayFolders.length === 1 ? "folder" : "folders"}</span>
            </div>
            {view === "grid" ? (
              // Cap the folders area so a company with many projects doesn't push
              // the document list off-screen — this region scrolls on its own.
              <div className="max-h-[240px] overflow-y-auto overflow-x-hidden rounded-xl border border-[#e5e7eb] bg-white p-3">
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {displayFolders.map((folder) => (
                    <FolderCard key={folder.id} {...folder} active={false} onClick={() => handleFolderClick(folder)} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-4 bg-[#fafafa] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#9ca3af] border-b border-[#f3f4f6]">
                  <span>Folder</span><span className="text-right">Items</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto divide-y divide-[#f3f4f6]">
                  {displayFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#fafafa] bg-white"
                    >
                      <span className="flex items-center gap-3">
                        <FolderOpen size={18} className="text-[#9ca3af]" />
                        <span className="text-sm font-semibold text-[#111827]">{folder.title}</span>
                      </span>
                      <span className="text-xs font-medium text-[#6b7280] text-right">{folder.meta}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showFolders && displayFolders.length === 0 && !selectedCompanyId && (
           <EmptyState title="No companies found." text="Create companies first. Each company becomes a document workspace." />
        )}

        {/* Company level: every document belonging to the company, in one place. */}
        {mode === "company" && (
          <FilesTable title={`All Documents — ${viewTitle}`} docs={displayFiles} selected={selected} onSelect={setSelected} onToggle={handleToggleVisibility} togglingId={togglingId} />
        )}

        {/* Project level: details + that project's documents, in tabs. */}
        {mode === "project" && currentProject && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[#e5e7eb] bg-white px-6 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-[#111827]">{currentProject.name}</h2>
                  {currentProject.clientProjectName && currentProject.clientProjectName !== currentProject.name && (
                    <p className="mt-0.5 truncate text-sm text-[#6b7280]">“{currentProject.clientProjectName}”</p>
                  )}
                  <p className="mt-0.5 text-xs text-[#9ca3af]">{currentCompany?.name || currentCompany?.companyName || currentProject.companyName}</p>
                </div>
                {currentProject.projectId && (
                  <span className="shrink-0 rounded-full bg-[#fff1ec] px-3 py-1 text-xs font-bold text-[#8D3118]">{currentProject.projectId}</span>
                )}
              </div>
              <div className="mt-4 flex gap-1">
                {[["details", "Project Details"], ["documents", `Documents (${displayFiles.length})`]].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setProjectTab(key)}
                    className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${projectTab === key ? "border-[#8D3118] text-[#8D3118]" : "border-transparent text-[#6b7280] hover:text-[#111827]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {projectTab === "details" ? (
              <ProjectDetails project={currentProject} company={currentCompany} />
            ) : (
              <FilesTable title="Project Documents" docs={displayFiles} selected={selected} onSelect={setSelected} onToggle={handleToggleVisibility} togglingId={togglingId} />
            )}
          </div>
        )}
      </section>

      {uploading && (
        <DocumentUploadPanel
          companies={companies}
          projects={projects}
          defaultCompanyId={selectedCompanyId || ""}
          defaultProjectId={selectedProjectId || ""}
          onClose={() => setUploading(false)}
          onSave={handleUpload}
        />
      )}
    </div>
  );
}
