import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderPlus, FilePlus2, FileText, FileType, Image, Frame,
  Folder as FolderIcon, MoreHorizontal, Trash2, X, Check,
} from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { storeGet, saveProject } from "../../lib/store";
import ProjectHeader from "./ProjectHeader";

const SYSTEM_FOLDERS = [
  { key: "Proposals", className: "bg-[#ffdbcc] text-[#884c2d]" },
  { key: "Contracts", className: "bg-[#eee1cf] text-[#665d50]" },
  { key: "Invoices", className: "bg-[#a2f0f2] text-[#026769]" },
  { key: "Deliverables", className: "bg-[#ffb693] text-[#6f381a]" },
  { key: "Internal", className: "bg-[#ede0db] text-[#6c6355]" },
];

const TYPE_META = {
  pdf: { icon: FileText, className: "bg-red-50 text-red-600" },
  figma: { icon: Frame, className: "bg-purple-50 text-purple-600" },
  doc: { icon: FileType, className: "bg-orange-50 text-orange-600" },
  image: { icon: Image, className: "bg-blue-50 text-blue-600" },
};

function getFileType(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["fig", "figma"].includes(ext)) return "figma";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  return "doc";
}

function formatSize(bytes) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
}

function formatSizeMB(mb) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${(mb || 0).toFixed(1)} MB`;
}

export default function ProjectFiles() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [uploadFolder, setUploadFolder] = useState("Deliverables");
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [docMenu, setDocMenu] = useState(null);
  const { records: companies } = useCrmRecords("companies");
  const [allProjects, setAllProjects] = useState(() => storeGet("projects"));

  useEffect(() => {
    function onUpdate(e) {
      if (e.detail?.type === "projects") setAllProjects(storeGet("projects"));
    }
    window.addEventListener("cs-store", onUpdate);
    return () => window.removeEventListener("cs-store", onUpdate);
  }, []);

  const company = useMemo(
    () => companies.find((c) => String(c.id) === companyId || String(c._id) === companyId),
    [companies, companyId]
  );
  const project = useMemo(
    () => allProjects.find((p) => String(p.id || p._id) === projectId && String(p.companyId) === companyId),
    [allProjects, companyId, projectId]
  );

  const documents = useMemo(() => project?.documents || [], [project]);
  const customFolders = useMemo(() => project?.customFolders || [], [project]);
  const allFolderDefs = useMemo(() => [
    ...SYSTEM_FOLDERS,
    ...customFolders.map(name => ({ key: name, className: "bg-violet-100 text-violet-700", custom: true })),
  ], [customFolders]);

  const folders = useMemo(() => allFolderDefs.map(def => {
    const docs = documents.filter(doc => doc.category === def.key);
    return { ...def, count: docs.length, size: docs.reduce((sum, doc) => sum + (doc.sizeMB || 0), 0) };
  }), [documents, allFolderDefs]);

  const visibleDocuments = activeFolder ? documents.filter(doc => doc.category === activeFolder) : documents;

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] p-10 text-center">
        <p className="text-sm font-semibold text-[#6c6355]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${project.id}/files`);
    showToast({ title: "Link copied", message: "Project files link copied to clipboard." });
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const category = uploadFolder || activeFolder || "Deliverables";
    const newDoc = {
      name: file.name,
      category,
      type: getFileType(file.name),
      sizeMB: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      uploadedBy: "Admin",
      _id: `doc-${Date.now()}`,
    };
    const updated = { ...project, documents: [newDoc, ...(project.documents || [])] };
    saveProject(updated);
    e.target.value = "";
    showToast({ title: "File uploaded", message: `${file.name} added to ${category}.` });
  }

  function handleDeleteDoc(doc) {
    const updated = { ...project, documents: (project.documents || []).filter(d => d._id !== doc._id && d.name !== doc.name) };
    saveProject(updated);
    setDocMenu(null);
    showToast({ title: "File removed", message: `${doc.name} deleted.` });
  }

  function handleAddFolder(e) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name || customFolders.includes(name) || SYSTEM_FOLDERS.some(f => f.key === name)) {
      showToast({ type: "error", title: "Invalid", message: "Folder name is empty or already exists." });
      return;
    }
    const updated = { ...project, customFolders: [...customFolders, name] };
    saveProject(updated);
    setNewFolderName("");
    setNewFolderMode(false);
    showToast({ title: "Folder created", message: `"${name}" folder added to this project.` });
  }

  return (
    <div className="space-y-6" onClick={() => setDocMenu(null)}>
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Files"
        onShare={handleShare}
        onNewTask={() => navigate("/admin/kanban")}
      />

      {/* Upload folder selector */}
      <div className="flex items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
        <FilePlus2 size={15} className="text-[#884c2d] shrink-0" />
        <span className="text-xs font-semibold text-[#374151]">Upload to:</span>
        <select
          value={uploadFolder}
          onChange={e => setUploadFolder(e.target.value)}
          className="text-xs border border-[#e5e7eb] rounded-lg px-2 py-1 outline-none focus:border-[#884c2d]"
        >
          {allFolderDefs.map(f => <option key={f.key}>{f.key}</option>)}
        </select>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#884c2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f381a] transition-colors"
        >
          <FilePlus2 size={13} /> Upload File
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      </div>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#211a17]">Directory</h3>
            <p className="mt-1 text-xs text-[#6c6355]">{documents.length} files across {folders.filter(f => f.count > 0).length} folders</p>
          </div>
          {newFolderMode ? (
            <form onSubmit={handleAddFolder} className="flex items-center gap-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name…"
                className="rounded-lg border border-[#e5e7eb] px-3 py-1.5 text-xs outline-none focus:border-[#884c2d] w-36"
              />
              <button type="submit" className="grid h-7 w-7 place-items-center rounded-lg bg-[#884c2d] text-white hover:bg-[#6f381a]">
                <Check size={13} />
              </button>
              <button type="button" onClick={() => setNewFolderMode(false)} className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
                <X size={13} />
              </button>
            </form>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setNewFolderMode(true)}>
              <FolderPlus size={14} /> New Folder
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {folders.map(folder => (
            <button
              key={folder.key}
              type="button"
              onClick={() => setActiveFolder(activeFolder === folder.key ? null : folder.key)}
              className={`group cursor-pointer rounded-xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                activeFolder === folder.key ? "border-[#884c2d] bg-white shadow-md" : "border-[#d8c2b9] bg-[#fff1ec] hover:bg-white"
              }`}
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-lg ${folder.className}`}>
                <FolderIcon size={24} />
              </div>
              <h4 className="text-sm font-bold text-[#211a17] truncate">{folder.key}</h4>
              <p className="mt-1 text-[11px] text-[#6c6355]">{folder.count} items · {formatSizeMB(folder.size)}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-[#211a17]">
            {activeFolder ? `${activeFolder} Documents` : "All Documents"}
          </h3>
          <div className="flex items-center gap-3">
            {activeFolder && (
              <button type="button" onClick={() => setActiveFolder(null)} className="text-xs font-bold text-[#884c2d] hover:underline">
                Clear filter
              </button>
            )}
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FilePlus2 size={14} /> Upload File
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          {visibleDocuments.length ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#ead8d1] bg-[#fff1ec]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6c6355]">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6c6355]">Folder</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6c6355] sm:table-cell">Upload Date</th>
                  <th className="hidden px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#6c6355] md:table-cell">Uploaded By</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#6c6355]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ead8d1]">
                {visibleDocuments.map((doc, index) => {
                  const meta = TYPE_META[doc.type] || TYPE_META.doc;
                  const Icon = meta.icon;
                  const menuKey = doc._id || doc.name;
                  return (
                    <tr key={index} className="transition-colors hover:bg-[#fff1ec]/60">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded ${meta.className}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#211a17]">{doc.name}</p>
                            <p className="text-[11px] text-[#6c6355]">{formatSizeMB(doc.sizeMB)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#6c6355]">{doc.category}</td>
                      <td className="hidden px-6 py-5 text-sm text-[#6c6355] sm:table-cell">{doc.date}</td>
                      <td className="hidden px-6 py-5 md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={doc.uploadedBy} size="sm" />
                          <span className="text-sm text-[#211a17]">{doc.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right relative" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDocMenu(docMenu === menuKey ? null : menuKey)}
                          className="text-[#6c6355] transition-colors hover:text-[#884c2d]"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {docMenu === menuKey && (
                          <div className="absolute right-6 top-full z-20 mt-1 w-36 rounded-xl border border-[#e5e7eb] bg-white py-1 shadow-lg text-left">
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]"
                              onClick={() => {
                                showToast({ type: "info", title: doc.name, message: `${doc.category} · Uploaded by ${doc.uploadedBy} on ${doc.date}` });
                                setDocMenu(null);
                              }}
                            >
                              View Info
                            </button>
                            <button
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteDoc(doc)}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
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
              <p className="text-sm text-[#6c6355] mb-3">No documents in {activeFolder ? `"${activeFolder}"` : "this project"} yet.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#884c2d] hover:underline"
              >
                Upload the first file →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
