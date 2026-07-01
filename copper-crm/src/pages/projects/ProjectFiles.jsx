import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderPlus, FilePlus2, FileText, FileType, Image, Frame,
  MoreHorizontal, Trash2, X, Check, Search, Info, ExternalLink,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import ProjectHeader from "./ProjectHeader";
import customFolderSvg from "../../assets/Folder.svg";

const TYPE_META = {
  pdf: { icon: FileText, className: "bg-red-50 text-red-600", label: "PDF" },
  figma: { icon: Frame, className: "bg-purple-50 text-purple-600", label: "Figma" },
  doc: { icon: FileType, className: "bg-orange-50 text-orange-600", label: "Document" },
  image: { icon: Image, className: "bg-blue-50 text-blue-600", label: "Image" },
};

const PAGE_SIZE = 8;

function getFileType(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["fig", "figma"].includes(ext)) return "figma";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  return "doc";
}

// Documents can carry their size as `sizeMB` (newer uploads) or `size` in bytes
// (older / other upload paths), so resolve from whatever is present. Returns
// null when no size is known, so the UI can show "—" instead of a fake "0.0 MB".
function docSizeMB(doc) {
  if (typeof doc?.sizeMB === "number") return doc.sizeMB;
  if (typeof doc?.size === "number") return doc.size / (1024 * 1024);
  return null;
}

function formatSizeMB(mb) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${(mb || 0).toFixed(1)} MB`;
}

function formatDocSize(doc) {
  const mb = docSizeMB(doc);
  return mb == null ? "—" : formatSizeMB(mb);
}

// Dates come in different shapes across sources (a pre-formatted string on
// embedded docs, an ISO date on invoices / collection docs). Normalise to one
// readable label.
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  return String(value); // already a display string like "30 Jun 2026"
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Read a file to a data URL while reporting read progress, so the upload UI can
// show a live percentage instead of freezing on large files.
function readFileWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Open a stored document. Data-URL navigation is blocked by browsers for
// top-level tabs, so convert it to a Blob object URL first — that's why files
// previously "didn't open". Plain http(s) URLs open directly.
function openDocument(doc, onError) {
  if (!doc?.fileUrl) {
    onError?.("No file is stored for this document.");
    return;
  }
  try {
    if (doc.fileUrl.startsWith("data:")) {
      const [meta, base64] = doc.fileUrl.split(",");
      const mime = (meta.match(/data:(.*?);base64/) || [])[1] || "application/octet-stream";
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
      window.open(blobUrl, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } else {
      window.open(doc.fileUrl, "_blank", "noopener");
    }
  } catch {
    onError?.("Could not open this file.");
  }
}

export default function ProjectFiles() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [uploadFolder, setUploadFolder] = useState("");
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [docMenu, setDocMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(null); // null = idle, 0-100 while uploading
  const [infoDoc, setInfoDoc] = useState(null);
  const { records: companies } = useCrmRecords("companies");
  const { records: allProjects, loading: projectsLoading, save: saveProject } = useCrmRecords("projects");
  const { records: allDocuments } = useCrmRecords("documents");
  const { records: allInvoices } = useCrmRecords("invoices");

  const project = useMemo(
    () => allProjects.find((p) => String(p.id || p._id) === projectId),
    [allProjects, projectId]
  );
  // companyId is absent when opened under /admin/projects/:id — derive the company
  // from the project. Match against BOTH the company's local id and Mongo _id,
  // since project.companyId is the _id while c.id is the local id.
  const company = useMemo(() => {
    const wanted = [companyId, project?.companyId].filter(Boolean).map(String);
    return companies.find((c) => [c.id, c._id].filter(Boolean).map(String).some((cid) => wanted.includes(cid)));
  }, [companies, companyId, project]);

  // The Files view shows EVERYTHING that belongs to this project, from all three
  // stores — the same sources the Document Center aggregates — so an invoice or a
  // centrally-uploaded document isn't invisible here:
  //   1. embedded  → project.documents (uploaded on this page)
  //   2. document  → Document collection records tagged with this projectId
  //   3. invoice   → Invoice records for this project, opened via the PDF endpoint
  const documents = useMemo(() => {
    if (!project) return [];
    const pid = String(project._id || project.id);
    const matchesProject = (value) => value != null && (String(value) === pid || String(value) === String(projectId));
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";

    const embedded = (project.documents || []).map((doc, i) => ({
      _source: "embedded",
      _id: doc._id || `embedded-${i}`,
      name: doc.name,
      category: doc.category || "General",
      type: doc.type || getFileType(doc.name),
      sizeMB: docSizeMB(doc),
      date: doc.date,
      uploadedBy: doc.uploadedBy || "Admin",
      fileUrl: doc.fileUrl,
    }));

    const collection = allDocuments
      .filter((d) => matchesProject(d.projectId))
      .map((d) => ({
        _source: "document",
        _id: d._id || d.id,
        name: d.fileName || d.name || "Document",
        category: d.category || "General",
        type: getFileType(d.fileName || d.name),
        sizeMB: docSizeMB(d),
        date: d.createdAt || d.date,
        uploadedBy: d.uploadedBy || d.owner || "Admin",
        fileUrl: d.fileUrl || d.storageUrl,
      }));

    const invoiceDocs = allInvoices
      .filter((inv) => matchesProject(inv.projectId))
      .map((inv) => {
        const num = inv.invoiceNumber || inv.invoiceId || inv.id;
        return {
          _source: "invoice",
          _id: inv._id || inv.id,
          name: `Tax Invoice - ${String(num).replace(/\//g, "-")}`,
          category: "Invoices",
          type: "pdf",
          sizeMB: null,
          date: inv.issueDate || inv.date || inv.createdAt,
          uploadedBy: "System",
          // Open the HTML invoice (instant, always works) rather than the PDF
          // endpoint, which uses Chromium and fails on cold starts. The invoice
          // page is fully printable to PDF from the browser if needed.
          fileUrl: `${apiBase}/api/invoices/${inv._id || inv.id || num}/html`,
        };
      });

    return [...invoiceDocs, ...collection, ...embedded];
  }, [project, allDocuments, allInvoices, projectId]);
  const customFolders = useMemo(() => (project?.customFolders || []).filter((name) => typeof name === "string"), [project]);
  const allFolderDefs = useMemo(() => {
    const docCategories = [...new Set(documents.map((doc) => doc.category).filter(Boolean))];
    const names = [...new Set([...customFolders, ...docCategories])];
    return names.map((name) => ({ key: name, className: "bg-violet-100 text-violet-700", custom: true }));
  }, [customFolders, documents]);

  const folders = useMemo(() => allFolderDefs.map((def) => {
    const docs = documents.filter((doc) => doc.category === def.key);
    return { ...def, count: docs.length, size: docs.reduce((sum, doc) => sum + (docSizeMB(doc) || 0), 0) };
  }), [documents, allFolderDefs]);

  // Folder click + search + type filter combine to scope the document list.
  const filteredDocuments = useMemo(() => {
    let list = activeFolder ? documents.filter((doc) => doc.category === activeFolder) : documents;
    const query = searchQuery.trim().toLowerCase();
    if (query) list = list.filter((doc) => `${doc.name || ""} ${doc.category || ""} ${doc.uploadedBy || ""}`.toLowerCase().includes(query));
    if (typeFilter) list = list.filter((doc) => (doc.type || getFileType(doc.name)) === typeFilter);
    return list;
  }, [documents, activeFolder, searchQuery, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageDocuments = filteredDocuments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Always offer every file type as a filter option, even when none of that type
  // is uploaded yet, so the dropdown is complete rather than showing only PDF.
  const typeOptions = Object.keys(TYPE_META);

  const effectiveUploadFolder = uploadFolder || allFolderDefs[0]?.key || "";

  if ((!company || !project) && projectsLoading) {
    return (
      <div className="rounded-2xl border border-[#6B7280] bg-[#FFFFFF] p-10 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">Loading project files…</p>
      </div>
    );
  }

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#6B7280] bg-[#FFFFFF] p-10 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const category = activeFolder || effectiveUploadFolder;
    if (!category) {
      e.target.value = "";
      showToast({ type: "error", title: "Create a folder first", message: "Add a folder before uploading a file." });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      e.target.value = "";
      showToast({ type: "error", title: "File too large", message: "Files must be 8 MB or smaller." });
      return;
    }
    try {
      setUploadProgress(0);
      const fileUrl = await readFileWithProgress(file, setUploadProgress);
      setUploadProgress(100);
      const newDoc = {
        name: file.name,
        category,
        type: getFileType(file.name),
        sizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        uploadedBy: "Admin",
        fileUrl,
        _id: `doc-${Date.now()}`,
      };
      const updated = { ...project, documents: [newDoc, ...(project.documents || [])] };
      await saveProject(updated);
      showToast({ title: "File uploaded", message: `${file.name} added to ${category}.` });
    } catch {
      showToast({ type: "error", title: "Upload failed", message: "Could not read that file. Try again." });
    } finally {
      setUploadProgress(null);
      e.target.value = "";
    }
  }

  async function handleDeleteDoc(doc) {
    const updated = { ...project, documents: (project.documents || []).filter((d) => d._id !== doc._id && d.name !== doc.name) };
    await saveProject(updated);
    setDocMenu(null);
    showToast({ title: "File removed", message: `${doc.name} deleted.` });
  }

  async function handleAddFolder(e) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name || allFolderDefs.some((f) => f.key === name)) {
      showToast({ type: "error", title: "Invalid", message: "Folder name is empty or already exists." });
      return;
    }
    const updated = { ...project, customFolders: [...customFolders, name] };
    await saveProject(updated);
    setUploadFolder(name);
    setNewFolderName("");
    setNewFolderMode(false);
    showToast({ title: "Folder created", message: `"${name}" folder added to this project.` });
  }

  async function handleDeleteFolder(folder) {
    const docsInFolder = documents.filter((d) => (d.category || "General") === folder.key);
    // A folder can only be removed once it's empty — delete/move its files first.
    if (docsInFolder.length) {
      showToast({ type: "error", title: "Folder isn't empty", message: `"${folder.key}" still has ${docsInFolder.length} file(s). Remove them before deleting the folder.` });
      return;
    }
    if (!window.confirm(`Delete the empty folder "${folder.key}"?`)) return;
    const updated = {
      ...project,
      customFolders: customFolders.filter((name) => name !== folder.key),
    };
    await saveProject(updated);
    if (activeFolder === folder.key) { setActiveFolder(null); setPage(1); }
    showToast({ title: "Folder deleted", message: `"${folder.key}" removed.` });
  }

  function handleUploadFolderChange(value) {
    if (value === "__new__") {
      setNewFolderMode(true);
      return;
    }
    setUploadFolder(value);
  }

  return (
    <div className="flex min-h-full flex-col bg-[#FFFFFF]" onClick={() => setDocMenu(null)}>
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Files"
        actionLabel="Upload File"
        actionIcon={FilePlus2}
        onAction={() => fileInputRef.current?.click()}
      />

      <div className="flex-1 space-y-5 p-6">
      {/* Upload folder selector + live upload progress */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <FilePlus2 size={15} className="text-[#8D3118] shrink-0" />
          <span className="text-xs font-semibold text-[#1A1A1A]">Upload to:</span>
          <select
            value={effectiveUploadFolder}
            onChange={(e) => handleUploadFolderChange(e.target.value)}
            className="text-xs border border-[#e5e7eb] rounded-lg px-2 py-1 outline-none focus:border-[#8D3118]"
          >
            {allFolderDefs.length === 0 && <option value="">No folders yet</option>}
            {allFolderDefs.map((f) => <option key={f.key} value={f.key}>{f.key}</option>)}
            <option value="__new__">+ Create new folder…</option>
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!allFolderDefs.length || uploadProgress !== null}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#8D3118] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6B7280] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FilePlus2 size={13} /> {uploadProgress !== null ? "Uploading…" : "Upload File"}
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
        {uploadProgress !== null && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[#6b7280]">
              <span>Uploading…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
              <div
                className="h-full rounded-full bg-[#8D3118] transition-[width] duration-200 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {!activeFolder && (
      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#1A1A1A]">Directory</h3>
            <p className="mt-1 text-xs text-[#6b7280]">{documents.length} files across {folders.filter((f) => f.count > 0).length} folders</p>
          </div>
          {newFolderMode ? (
            <form onSubmit={handleAddFolder} className="flex items-center gap-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name…"
                className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs outline-none focus:border-[#8D3118] w-36"
              />
              <button type="submit" className="grid h-7 w-7 place-items-center rounded-lg bg-[#8D3118] text-white hover:bg-[#6B7280]">
                <Check size={13} />
              </button>
              <button type="button" onClick={() => { setNewFolderMode(false); setNewFolderName(""); }} className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#E5E7EB]">
                <X size={13} />
              </button>
            </form>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setNewFolderMode(true)}>
              <FolderPlus size={14} /> New Folder
            </Button>
          )}
        </div>

        {folders.length ? (
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {folders.map((folder) => (
              <div key={folder.key} className="group relative">
                <button
                  type="button"
                  onClick={() => { setActiveFolder(activeFolder === folder.key ? null : folder.key); setPage(1); }}
                  className={`flex w-full flex-col items-center justify-start rounded-xl p-3 text-center transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:-translate-y-1 will-change-transform ${
                    activeFolder === folder.key ? "bg-black/10 ring-1 ring-black/5" : "bg-transparent"
                  }`}
                >
                  <img src={customFolderSvg} alt="Folder" className="mb-3 h-[96px] w-auto object-contain drop-shadow-sm" />
                  <p className="line-clamp-2 w-full text-[13px] font-medium leading-tight text-[#1A1A1A]">{folder.key}</p>
                  <p className="mt-0.5 w-full text-[11px] text-[#6B7280]">{folder.count} items · {formatSizeMB(folder.size)}</p>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
                  title="Delete folder"
                  className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-[#6B7280] opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#6B7280] bg-[#FFFFFF] p-8 text-center">
            <p className="text-sm text-[#6b7280]">No folders yet for this project.</p>
            <button onClick={() => setNewFolderMode(true)} className="mt-2 text-xs font-bold text-[#8D3118] hover:underline">
              Create the first folder →
            </button>
          </div>
        )}
      </section>
      )}

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {activeFolder ? (
            <nav className="flex items-center gap-1.5 text-base">
              <button
                type="button"
                onClick={() => { setActiveFolder(null); setPage(1); }}
                className="font-display font-semibold text-[#8D3118] hover:underline"
              >
                Directory
              </button>
              <ChevronRight size={16} className="text-[#6B7280]" />
              <span className="font-display font-semibold text-[#1A1A1A]">{activeFolder}</span>
              <span className="ml-1 text-xs font-normal text-[#6B7280]">({filteredDocuments.length} files)</span>
            </nav>
          ) : (
            <h3 className="font-display text-lg font-semibold text-[#1A1A1A]">All Documents</h3>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3">
              <Search size={14} className="text-[#6B7280]" />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Search files…"
                className="w-40 bg-transparent text-xs text-[#1A1A1A] outline-none placeholder:text-[#6B7280]"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-[#6B7280] hover:text-[#6b7280]">
                  <X size={13} />
                </button>
              )}
            </div>
            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-2 text-xs text-[#1A1A1A] outline-none focus:border-[#8D3118]"
            >
              <option value="">All types</option>
              {typeOptions.map((key) => <option key={key} value={key}>{TYPE_META[key].label}</option>)}
            </select>
            {(activeFolder || searchQuery || typeFilter) && (
              <button
                type="button"
                onClick={() => { setActiveFolder(null); setSearchQuery(""); setTypeFilter(""); setPage(1); }}
                className="text-xs font-bold text-[#8D3118] hover:underline"
              >
                Clear
              </button>
            )}
            <Button variant="secondary" size="sm" disabled={!allFolderDefs.length} onClick={() => fileInputRef.current?.click()}>
              <FilePlus2 size={14} /> Upload File
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#6B7280] bg-[#FFFFFF] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {pageDocuments.length ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FFFFFF]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Folder</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b7280] sm:table-cell">Size</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b7280] sm:table-cell">Upload Date</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6b7280] md:table-cell">Uploaded By</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#6b7280]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {pageDocuments.map((doc, index) => {
                  const meta = TYPE_META[doc.type] || TYPE_META.doc;
                  const Icon = meta.icon;
                  const menuKey = doc._id || doc.name;
                  return (
                    <tr key={menuKey || index} className="transition-colors hover:bg-[#E5E7EB]/60">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openDocument(doc, (msg) => showToast({ type: "error", title: "Can't open", message: msg }))}
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded ${meta.className} transition-transform hover:scale-105`}
                            title="Open file"
                          >
                            <Icon size={18} />
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openDocument(doc, (msg) => showToast({ type: "error", title: "Can't open", message: msg }))}
                              className="block max-w-[220px] truncate text-left text-sm font-semibold text-[#1A1A1A] hover:text-[#8D3118] hover:underline"
                            >
                              {doc.name}
                            </button>
                            <p className="text-[11px] text-[#6b7280] sm:hidden">{formatDocSize(doc)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#6b7280]">{doc.category}</td>
                      <td className="hidden px-6 py-5 text-sm text-[#6b7280] sm:table-cell">{formatDocSize(doc)}</td>
                      <td className="hidden px-6 py-5 text-sm text-[#6b7280] sm:table-cell">{formatDate(doc.date)}</td>
                      <td className="hidden px-6 py-5 md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={doc.uploadedBy} size="sm" />
                          <span className="text-sm text-[#1A1A1A]">{doc.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDocMenu(docMenu === menuKey ? null : menuKey)}
                          className="text-[#6b7280] transition-colors hover:text-[#8D3118]"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {docMenu === menuKey && (
                          <div className="absolute right-6 top-full z-20 mt-1 w-40 rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-lg text-left">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#E5E7EB] disabled:text-[#6B7280]"
                              disabled={!doc.fileUrl}
                              onClick={() => { openDocument(doc, (msg) => showToast({ type: "error", title: "Can't open", message: msg })); setDocMenu(null); }}
                            >
                              <ExternalLink size={14} /> Open file
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#E5E7EB]"
                              onClick={() => { setInfoDoc(doc); setDocMenu(null); }}
                            >
                              <Info size={14} /> View Info
                            </button>
                            {doc._source === "embedded" && (
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteDoc(doc)}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm text-[#6b7280] mb-3">
                {searchQuery || typeFilter
                  ? "No files match your search."
                  : `No documents in ${activeFolder ? `"${activeFolder}"` : "this project"} yet.`}
              </p>
              {!searchQuery && !typeFilter && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-[#8D3118] hover:underline"
                >
                  Upload the first file →
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredDocuments.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#FFFFFF]/40 px-6 py-3">
              <p className="text-[11px] text-[#6b7280]">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredDocuments.length)} of {filteredDocuments.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#E5E7EB] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 text-xs font-semibold text-[#1A1A1A]">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#E5E7EB] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      </div>

      {/* View Info panel */}
      {infoDoc && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/40 p-4" onClick={() => setInfoDoc(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header — full-width so the whole file name is visible */}
            <div className="relative border-b border-[#FFFFFF] bg-[#FFFFFF] px-5 pb-4 pt-5">
              <button
                onClick={() => setInfoDoc(null)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg text-[#6B7280] hover:bg-[#E5E7EB]"
              >
                <X size={15} />
              </button>
              <div className="flex items-start gap-3 pr-8">
                {(() => {
                  const meta = TYPE_META[infoDoc.type] || TYPE_META.doc;
                  const Icon = meta.icon;
                  return (
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${meta.className}`}>
                      <Icon size={20} />
                    </div>
                  );
                })()}
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold leading-snug text-[#1A1A1A]">{infoDoc.name}</p>
                  <p className="mt-1 inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280] ring-1 ring-[#e5e7eb]">
                    {(TYPE_META[infoDoc.type] || TYPE_META.doc).label}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="px-5 py-4">
              <dl className="divide-y divide-[#FFFFFF] text-sm">
                {[
                  ["Folder", infoDoc.category || "—"],
                  ["Size", formatDocSize(infoDoc)],
                  ["Uploaded by", infoDoc.uploadedBy || "—"],
                  ["Upload date", formatDate(infoDoc.date)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-[#6b7280]">{label}</dt>
                    <dd className="break-words text-right font-semibold text-[#1A1A1A]">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setInfoDoc(null)}>Close</Button>
                <Button
                  size="sm"
                  disabled={!infoDoc.fileUrl}
                  onClick={() => openDocument(infoDoc, (msg) => showToast({ type: "error", title: "Can't open", message: msg }))}
                >
                  <ExternalLink size={14} /> Open file
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
