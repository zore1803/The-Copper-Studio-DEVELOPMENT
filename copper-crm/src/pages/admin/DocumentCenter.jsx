import { useMemo, useState } from "react";
import {
  Building2, FileArchive, FileText, Folder, FolderOpen, Grid3X3,
  Link2, List, Lock, Search, Share2, Upload, Users
} from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

const VISIBILITY = {
  private: { label: "Private", icon: Lock, className: "bg-gray-100 text-gray-600" },
  internal: { label: "Internal Team", icon: Users, className: "bg-blue-50 text-blue-700" },
  project: { label: "Project Team", icon: FolderOpen, className: "bg-amber-50 text-amber-700" },
  client: { label: "Client Visible", icon: Share2, className: "bg-emerald-50 text-emerald-700" },
};

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
    <div className="rounded-xl border border-dashed border-[#d8c2b9] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <Folder size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>
    </div>
  );
}

function FolderCard({ icon: Icon, title, meta, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-[#e5e7eb] bg-white p-4 text-left transition hover:border-[#c6aa9b] hover:shadow-sm"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <Icon size={20} />
      </div>
      <p className="truncate text-sm font-bold text-[#111827]">{title}</p>
      <p className="mt-1 text-xs text-[#6b7280]">{meta}</p>
    </button>
  );
}

function DocumentRow({ doc, selected, onSelect }) {
  const type = fileType(doc.fileName || doc.name || doc.storageUrl);
  const Icon = TYPE_ICON[type] || FileText;
  const visibility = VISIBILITY[doc.visibility] || VISIBILITY.private;
  const VisibilityIcon = visibility.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(doc)}
      className={`grid w-full grid-cols-[minmax(0,1.5fr)_120px_130px_120px] gap-4 border-b border-[#f3f4f6] px-4 py-3 text-left text-sm hover:bg-[#fafafa] ${selected ? "bg-[#fff8f6]" : "bg-white"}`}
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
      <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${visibility.className}`}>
        <VisibilityIcon size={11} /> {visibility.label}
      </span>
      <span className="text-[#6b7280]">{doc.version || "v1"}</span>
    </button>
  );
}

export default function DocumentCenter({ mode = "company" }) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const { records: companies } = useCrmRecords("companies");
  const { records: projects } = useCrmRecords("projects");
  const { records: documents } = useCrmRecords("documents");

  const projectDocs = useMemo(() => projects.flatMap((project) =>
    (project.documents || []).map((doc) => ({
      ...doc,
      projectId: project.id || project._id,
      companyId: project.companyId,
      projectName: project.name || project.projectName,
      visibility: doc.visibility || (doc.category === "Internal" ? "internal" : "client"),
      folderPath: `${project.name || "Project"} / ${doc.category || "Files"}`,
      fileName: doc.fileName || doc.name,
    }))
  ), [projects]);

  const allDocuments = useMemo(() => [...documents, ...projectDocs], [documents, projectDocs]);
  const visibleDocs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allDocuments.filter((doc) => {
      const haystack = `${doc.fileName || doc.name || ""} ${doc.folderPath || ""} ${doc.tags?.join(" ") || ""}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      if (!matchesQuery) return false;
      if (mode === "internal") return doc.visibility === "internal" || doc.category === "Internal";
      if (mode === "client") return doc.visibility === "client" || doc.category !== "Internal";
      return true;
    });
  }, [allDocuments, mode, query]);

  const page = {
    company: {
      title: "Company Folders",
      subtitle: "A folder-first view of all company documents, proposals, contracts, invoices, projects, and shared files.",
      folders: companies.map((company) => ({
        id: company.id || company._id,
        icon: Building2,
        title: company.companyName || company.name || "Unnamed company",
        meta: `${projects.filter((p) => String(p.companyId) === String(company.id || company._id)).length} projects`,
      })),
      empty: "Create companies first. Each company becomes a document workspace.",
    },
    project: {
      title: "Project Folders",
      subtitle: "Project files, deliverables, versions, shared documents, and activity in one place.",
      folders: projects.map((project) => ({
        id: project.id || project._id,
        icon: FolderOpen,
        title: project.name || project.projectName || "Untitled project",
        meta: `${(project.documents || []).length} documents`,
      })),
      empty: "Create projects first. Each project gets proposals, contracts, invoices, design files, deliverables, and client files.",
    },
    internal: {
      title: "Internal Documents",
      subtitle: "Admin-only SOPs, templates, branding, HR, operations, and legal documents.",
      folders: [
        { id: "sops", icon: Lock, title: "SOPs", meta: "Internal Team" },
        { id: "templates", icon: FileText, title: "Templates", meta: "Proposal, invoice, contract" },
        { id: "branding", icon: Folder, title: "Branding", meta: "Guidelines and assets" },
        { id: "legal", icon: Lock, title: "Legal", meta: "Admin only" },
      ],
      empty: "Upload internal documents with Internal Team visibility.",
    },
    client: {
      title: "Client Shared Documents",
      subtitle: "Documents visible in the Client Portal: proposals, contracts, invoices, reports, deliverables, and manuals.",
      folders: [
        { id: "proposals", icon: Share2, title: "Proposals", meta: "Client visible" },
        { id: "contracts", icon: Share2, title: "Contracts", meta: "Client visible" },
        { id: "invoices", icon: Share2, title: "Invoices", meta: "Client visible" },
        { id: "deliverables", icon: Share2, title: "Deliverables", meta: "Client visible" },
      ],
      empty: "Mark documents as Client Visible to publish them to the portal.",
    },
  }[mode];

  return (
    <div className="flex min-h-full bg-[#f5f6fa]">
      <section className="min-w-0 flex-1 p-6">
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Document Center</p>
            <h1 className="mt-1 text-2xl font-bold text-[#111827]">{page.title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">{page.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3">
              <Search size={14} className="text-[#9ca3af]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents" className="w-52 bg-transparent text-sm outline-none" />
            </div>
            <button onClick={() => setView("grid")} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${view === "grid" ? "border-[#884c2d] text-[#884c2d]" : "border-[#e5e7eb] text-[#6b7280]"}`}><Grid3X3 size={15} /></button>
            <button onClick={() => setView("list")} className={`flex h-9 w-9 items-center justify-center rounded-lg border ${view === "list" ? "border-[#884c2d] text-[#884c2d]" : "border-[#e5e7eb] text-[#6b7280]"}`}><List size={15} /></button>
            <Button><Upload size={14} /> Upload</Button>
          </div>
        </div>

        {view === "grid" && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {page.folders.map((folder) => <FolderCard key={folder.id} {...folder} />)}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-[#111827]">Files</p>
              <p className="text-xs text-[#6b7280]">{visibleDocs.length} documents visible in this view</p>
            </div>
            <p className="text-xs font-semibold text-[#6b7280]">Private / Internal / Project Team / Client Visible</p>
          </div>
          {visibleDocs.length ? (
            <div>
              <div className="grid grid-cols-[minmax(0,1.5fr)_120px_130px_120px] gap-4 bg-[#fafafa] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#9ca3af]">
                <span>Name</span><span>Type</span><span>Visibility</span><span>Version</span>
              </div>
              {visibleDocs.map((doc, index) => (
                <DocumentRow key={doc._id || `${doc.fileName}-${index}`} doc={doc} selected={selected === doc} onSelect={setSelected} />
              ))}
            </div>
          ) : <EmptyState title="No documents yet." text={page.empty} />}
        </div>
      </section>

      <aside className="hidden w-80 shrink-0 border-l border-[#e5e7eb] bg-white p-5 xl:block">
        <p className="text-sm font-bold text-[#111827]">File Details</p>
        {selected ? (
          <div className="mt-4 space-y-4 text-sm">
            <Detail label="Name" value={selected.fileName || selected.name} />
            <Detail label="Owner" value={selected.uploadedBy || selected.owner} />
            <Detail label="Folder" value={selected.folderPath || selected.category} />
            <Detail label="Version" value={selected.version || "v1"} />
            <Detail label="Shared Status" value={(VISIBILITY[selected.visibility]?.label) || "Private"} />
            <Detail label="Created" value={selected.createdAt || selected.date} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#6b7280]">Select a file to inspect owner, version, created date, size, and sharing status.</p>
        )}
      </aside>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="mt-1 text-[#374151]">{value || "Not added"}</p>
    </div>
  );
}
