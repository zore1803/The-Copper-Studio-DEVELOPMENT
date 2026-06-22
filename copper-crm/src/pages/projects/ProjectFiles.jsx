import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderPlus, FilePlus2, FileText, FileType, Image, Frame, Plus,
  Folder as FolderIcon, FolderOpen, Trash2, X, Check, Files,
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import ProjectHeader from "./ProjectHeader";

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

function formatSizeMB(mb) {
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${(mb || 0).toFixed(1)} MB`;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="rounded-xl border border-[#E1E4EA] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F1F5] px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-[#0E121B]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#525866]">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[#E1E4EA] bg-[#fafafa] p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-[#0E121B]">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-[#525866]">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default function ProjectFiles() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [openFolder, setOpenFolder] = useState(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploadPanel, setUploadPanel] = useState(null);
  const { records: companies } = useCrmRecords("companies");
  const { records: allProjects, loading: projectsLoading, save: saveProject } = useCrmRecords("projects");

  const company = useMemo(
    () => companies.find((c) => String(c.id) === companyId || String(c._id) === companyId),
    [companies, companyId]
  );
  const project = useMemo(
    () => allProjects.find((p) => String(p.id || p._id) === projectId),
    [allProjects, projectId]
  );

  const documents = useMemo(() => project?.documents || [], [project]);
  const customFolders = useMemo(() => (project?.customFolders || []).filter((name) => typeof name === "string"), [project]);
  const allFolderDefs = useMemo(() => {
    const docCategories = [...new Set(documents.map((doc) => doc.category).filter(Boolean))];
    const names = [...new Set([...customFolders, ...docCategories])];
    return names.map((name) => ({ key: name }));
  }, [customFolders, documents]);

  const folders = useMemo(() => allFolderDefs.map(def => {
    const docs = documents.filter(doc => doc.category === def.key);
    return { ...def, count: docs.length, size: docs.reduce((sum, doc) => sum + (doc.sizeMB || 0), 0) };
  }), [documents, allFolderDefs]);

  const openFolderDocuments = openFolder ? documents.filter(doc => doc.category === openFolder) : [];

  if ((!company || !project) && projectsLoading) {
    return (
      <div className="rounded-2xl border border-[#E1E4EA] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#525866]">Loading project files…</p>
      </div>
    );
  }

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#E1E4EA] bg-white p-10 text-center">
        <p className="text-sm font-semibold text-[#525866]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${project.id}/files`);
    showToast({ title: "Link copied", message: "Project files link copied to clipboard." });
  }

  async function handleUpload({ file, category }) {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast({ type: "error", title: "File too large", message: "Files must be 8 MB or smaller." });
      return;
    }
    const fileUrl = await readFileAsDataUrl(file);
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
    setUploadPanel(null);
    showToast({ title: "File uploaded", message: `${file.name} added to ${category}.` });
  }

  async function handleDeleteDoc(doc) {
    const updated = { ...project, documents: (project.documents || []).filter(d => d._id !== doc._id && d.name !== doc.name) };
    await saveProject(updated);
    showToast({ title: "File removed", message: `${doc.name} deleted.` });
  }

  async function handleAddFolder(e) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name || allFolderDefs.some(f => f.key === name)) {
      showToast({ type: "error", title: "Invalid", message: "Folder name is empty or already exists." });
      return;
    }
    const updated = { ...project, customFolders: [...customFolders, name] };
    await saveProject(updated);
    setNewFolderName("");
    setNewFolderMode(false);
    showToast({ title: "Folder created", message: `"${name}" folder added to this project.` });
  }

  async function handleDeleteFolder(name) {
    const updated = {
      ...project,
      customFolders: customFolders.filter(f => f !== name),
      documents: documents.filter(doc => doc.category !== name),
    };
    await saveProject(updated);
    if (openFolder === name) setOpenFolder(null);
    showToast({ title: "Folder deleted", message: `"${name}" and its files were removed.` });
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Files"
        onShare={handleShare}
        onNewTask={() => navigate("/admin/kanban")}
      />

      <Section
        title="Folders"
        subtitle={`${documents.length} file${documents.length === 1 ? "" : "s"} across ${folders.length} folder${folders.length === 1 ? "" : "s"}`}
        action={
          newFolderMode ? (
            <form onSubmit={handleAddFolder} className="flex items-center gap-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name…"
                className="rounded-lg border border-[#E1E4EA] px-3 py-1.5 text-xs outline-none focus:border-[#884c2d] w-36"
              />
              <button type="submit" className="grid h-7 w-7 place-items-center rounded-lg bg-[#884c2d] text-white hover:bg-[#6f381a]">
                <Check size={13} />
              </button>
              <button type="button" onClick={() => setNewFolderMode(false)} className="grid h-7 w-7 place-items-center rounded-lg border border-[#E1E4EA] text-[#525866] hover:bg-[#fafafa]">
                <X size={13} />
              </button>
            </form>
          ) : (
            <button onClick={() => setNewFolderMode(true)} className="flex items-center gap-1.5 rounded-lg border border-[#E1E4EA] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#525866] hover:bg-[#fafafa] transition-colors">
              <FolderPlus size={13} /> New Folder
            </button>
          )
        }
      >
        {folders.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {folders.map(folder => (
              <button
                key={folder.key}
                type="button"
                onClick={() => setOpenFolder(folder.key)}
                className="group cursor-pointer rounded-xl border border-[#E1E4EA] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#884c2d] hover:shadow-md"
              >
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
                  <FolderIcon size={20} />
                </div>
                <h4 className="text-sm font-bold text-[#0E121B] truncate">{folder.key}</h4>
                <p className="mt-1 text-[11px] text-[#525866]">{folder.count} item{folder.count === 1 ? "" : "s"} · {formatSizeMB(folder.size)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderOpen}
            title="No folders yet"
            text="Create a folder to start organizing files for this project."
            action={
              <button onClick={() => setNewFolderMode(true)} className="text-xs font-bold text-[#884c2d] hover:underline">
                Create the first folder →
              </button>
            }
          />
        )}
      </Section>

      {openFolder && (
        <FolderViewerPanel
          folderName={openFolder}
          documents={openFolderDocuments}
          onClose={() => setOpenFolder(null)}
          onDelete={handleDeleteDoc}
          onDeleteFolder={() => handleDeleteFolder(openFolder)}
          onUpload={() => setUploadPanel({ category: openFolder })}
        />
      )}

      {uploadPanel && (
        <UploadPanel
          defaultCategory={uploadPanel.category}
          folders={allFolderDefs}
          onClose={() => setUploadPanel(null)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

function FolderViewerPanel({ folderName, documents, onClose, onDelete, onDeleteFolder, onUpload }) {
  return (
    <SidePanel
      title={folderName}
      subtitle={`${documents.length} file${documents.length === 1 ? "" : "s"} in this folder.`}
      onClose={onClose}
      footer={
        <div className="flex justify-between gap-2">
          <Button variant="secondary" onClick={onDeleteFolder}><Trash2 size={14} /> Delete Folder</Button>
          <Button onClick={onUpload}><Plus size={14} /> Upload to this folder</Button>
        </div>
      }
    >
      {documents.length ? (
        <div className="space-y-2">
          {documents.map((doc, index) => {
            const meta = TYPE_META[doc.type] || TYPE_META.doc;
            const Icon = meta.icon;
            return (
              <div key={doc._id || `${doc.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#E1E4EA] bg-white p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.className}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0E121B]">{doc.name}</p>
                    <p className="text-xs text-[#525866]">{formatSizeMB(doc.sizeMB)} · {doc.date} · {doc.uploadedBy}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.fileUrl ? (
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-[#884c2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f381a]">
                      View
                    </a>
                  ) : (
                    <span className="rounded-lg border border-[#E1E4EA] px-3 py-1.5 text-xs font-semibold text-[#9ca3af]">No file</span>
                  )}
                  <button onClick={() => onDelete(doc)} className="rounded-lg p-2 text-[#525866] hover:bg-red-50 hover:text-red-600" title="Delete file">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Files} title="No files in this folder yet." />
      )}
    </SidePanel>
  );
}

function UploadPanel({ defaultCategory, folders, onClose, onUpload }) {
  const [category, setCategory] = useState(defaultCategory || folders[0]?.key || "");
  const [file, setFile] = useState(null);

  return (
    <SidePanel
      title="Upload Document"
      subtitle="Attach a file to this project."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!file || !category} onClick={() => onUpload({ file, category })}>
            <FilePlus2 size={14} /> Upload
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">File *</span>
          <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-dashed border-[#E1E4EA] bg-[#fafafa] px-3 py-3">
            <input id="proj-doc-browse" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label htmlFor="proj-doc-browse" className="cursor-pointer rounded-lg bg-[#884c2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f381a]">
              Browse…
            </label>
            <span className="truncate text-xs text-[#6b7280]">{file ? file.name : "No file selected"}</span>
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Folder *</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[#E1E4EA] px-3 py-2 text-sm outline-none focus:border-[#884c2d]"
          >
            {folders.length ? folders.map(f => <option key={f.key} value={f.key}>{f.key}</option>) : <option value="">No folders yet</option>}
          </select>
        </label>
      </div>
    </SidePanel>
  );
}
