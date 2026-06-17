import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, Calendar, Check, ChevronRight, Edit3, Loader2,
  Plus, Save, Search, Trash2, Users, X, FolderOpen, Info
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { adminApi } from "../../lib/clientApi";

/* ─── helpers ─── */

function fmt(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function fmtDisplay(date) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name = "") {
  return name.split(" ").map((p) => p[0] || "").join("").slice(0, 2).toUpperCase();
}

/* ─── tiny design atoms ─── */

function Pill({ label, color = "default" }) {
  const styles = {
    default: "bg-[#F1F1F5] text-[#525866]",
    green:   "bg-emerald-50 text-emerald-700",
    amber:   "bg-amber-50 text-amber-700",
    red:     "bg-red-50 text-red-700",
    copper:  "bg-[#fff1ec] text-[#884c2d]",
    blue:    "bg-blue-50 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[color]}`}>
      {label}
    </span>
  );
}

function statusPill(status) {
  const map = {
    not_started: { label: "Not Started", color: "default" },
    in_progress:  { label: "In Progress",  color: "copper" },
    on_hold:      { label: "On Hold",       color: "amber" },
    completed:    { label: "Completed",     color: "green" },
    cancelled:    { label: "Cancelled",     color: "red" },
  };
  return map[status] || { label: status, color: "default" };
}

function stagePill(status) {
  const map = {
    pending:     { label: "Pending",     color: "default" },
    in_progress: { label: "In Progress", color: "copper" },
    completed:   { label: "Done",        color: "green" },
  };
  return map[status] || { label: status, color: "default" };
}

function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin text-[#884c2d]" />;
}

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl text-sm font-semibold ${
      type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
    }`} style={{ animation: "toast-in .2s ease" }}>
      {type === "error" ? <AlertCircle size={15} /> : <Check size={15} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
    </div>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`rounded-xl border border-[#E1E4EA] bg-[#FFFFFF] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ─── STAGE EDITOR ─── */

const BLANK_STAGE = { name: "", status: "pending", startDate: "", endDate: "", notes: "" };

function StageEditor({ stages, onChange }) {
  function update(i, patch) {
    onChange(stages.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  }
  function remove(i) {
    onChange(stages.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...stages, { ...BLANK_STAGE }]);
  }

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={i} className="rounded-xl border border-[#E1E4EA] bg-[#FAFAFA]/60 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-[#884c2d] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <input
              value={stage.name}
              onChange={e => update(i, { name: e.target.value })}
              placeholder="Stage name (e.g. Discovery & Research)"
              className="flex-1 rounded-lg border border-[#E1E4EA] bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#C57E5B]/60"
            />
            <select
              value={stage.status}
              onChange={e => update(i, { status: e.target.value })}
              className="rounded-lg border border-[#E1E4EA] bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-[#884c2d]"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button onClick={() => remove(i)} className="rounded-lg p-1.5 text-[#525866] hover:bg-red-50 hover:text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#525866]">Start Date</span>
              <input
                type="date"
                value={fmt(stage.startDate)}
                onChange={e => update(i, { startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#E1E4EA] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#C57E5B]/60"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#525866]">End Date</span>
              <input
                type="date"
                value={fmt(stage.endDate)}
                onChange={e => update(i, { endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#E1E4EA] bg-white px-3 py-1.5 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#C57E5B]/60"
              />
            </label>
          </div>
          <textarea
            value={stage.notes}
            onChange={e => update(i, { notes: e.target.value })}
            placeholder="Stage notes (visible to client)…"
            rows={2}
            className="w-full rounded-lg border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none resize-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#C57E5B]/60"
          />
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-2 w-full justify-center rounded-xl border-2 border-dashed border-[#E1E4EA] py-3 text-xs font-bold text-[#884c2d] hover:border-[#884c2d] hover:bg-[#fff1ec] transition-all"
      >
        <Plus size={14} /> Add Stage
      </button>
    </div>
  );
}

/* ─── PROJECT FORM ─── */

const BLANK_PROJECT = {
  name: "",
  description: "",
  packageName: "",
  status: "not_started",
  progress: 0,
  currentPhase: "",
  startDate: "",
  expectedEndDate: "",
  adminNotes: "",
  stages: [],
  deliverables: [],
};

function ProjectForm({ initial, clientId, token, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...BLANK_PROJECT,
    ...(initial || {}),
    startDate: fmt(initial?.startDate),
    expectedEndDate: fmt(initial?.expectedEndDate),
    stages: (initial?.stages || []).map(s => ({
      ...s,
      startDate: fmt(s.startDate),
      endDate: fmt(s.endDate),
    })),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function patch(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, clientId };
      const saved = initial?._id
        ? await adminApi.updateProject(initial._id, payload, token)
        : await adminApi.createProject(payload, token);
      onSaved(saved);
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-xs font-bold text-[#525866]">Project Name *</span>
            <input value={form.name} onChange={e => patch("name", e.target.value)} placeholder="e.g. Monolith Architectural Identity"
              className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#525866]">Package / Service</span>
            <input value={form.packageName} onChange={e => patch("packageName", e.target.value)} placeholder="e.g. Growth Studio"
              className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#525866]">Current Phase</span>
            <input value={form.currentPhase} onChange={e => patch("currentPhase", e.target.value)} placeholder="e.g. Logo Development"
              className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#525866]">Status</span>
            <select value={form.status} onChange={e => patch("status", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d]">
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#525866]">Progress %</span>
            <div className="mt-1.5 flex items-center gap-3">
              <input type="range" min={0} max={100} step={5} value={form.progress}
                onChange={e => patch("progress", Number(e.target.value))}
                className="flex-1 accent-[#884c2d]" />
              <span className="w-10 text-right text-sm font-bold text-[#884c2d]">{form.progress}%</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#525866]">Start Date</span>
            <input type="date" value={form.startDate} onChange={e => patch("startDate", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#525866]">Expected End Date</span>
            <input type="date" value={form.expectedEndDate} onChange={e => patch("expectedEndDate", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
          </label>
        </div>

        {/* Description */}
        <label className="block">
          <span className="text-xs font-bold text-[#525866]">Description (internal)</span>
          <textarea value={form.description} onChange={e => patch("description", e.target.value)}
            rows={2} placeholder="Brief internal description of this project…"
            className="mt-1.5 w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none resize-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
        </label>

        {/* Admin Notes (visible to client) */}
        <label className="block">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-[#525866]">Notes for Client</span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
              <Info size={9} /> Client visible
            </span>
          </div>
          <textarea value={form.adminNotes} onChange={e => patch("adminNotes", e.target.value)}
            rows={3} placeholder="These notes are visible to the client in their portal timeline…"
            className="w-full rounded-xl border border-[#E1E4EA] bg-white px-3 py-2 text-sm outline-none resize-none focus:border-[#884c2d] focus:ring-4 focus:ring-[#C57E5B]/50" />
        </label>

        {/* Stages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#525866]">Project Stages</span>
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
              <Info size={9} /> Client visible
            </span>
          </div>
          <StageEditor
            stages={form.stages}
            onChange={s => patch("stages", s)}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-semibold text-red-700">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex items-center gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel}
            className="h-9 rounded-xl border border-[#E1E4EA] bg-white px-4 text-xs font-bold text-[#525866] hover:bg-[#FAFAFA] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex h-9 items-center gap-2 rounded-xl bg-[#884c2d] px-4 text-xs font-bold text-white shadow-md shadow-[#884c2d]/20 hover:bg-[#6f381a] disabled:opacity-60 transition-colors">
            {saving ? <><Spinner size={13} /> Saving…</> : <><Save size={13} /> {initial?._id ? "Save Changes" : "Create Project"}</>}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ─── MEETINGS PANEL ─── */

function MeetingsPanel({ meetings, token, onUpdated }) {
  const [updatingId, setUpdatingId] = useState(null);

  async function updateStatus(m, status) {
    setUpdatingId(m._id);
    try {
      const updated = await adminApi.updateMeeting(m._id, { ...m, status }, token);
      onUpdated(updated);
    } catch {}
    finally { setUpdatingId(null); }
  }

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-[#525866]">
        <Calendar size={32} className="mb-2 opacity-30" />
        <p className="text-sm font-semibold">No meeting requests</p>
      </div>
    );
  }

  const statusColor = { requested: "amber", confirmed: "copper", completed: "green", cancelled: "default" };

  return (
    <div className="divide-y divide-[#E1E4EA]/50">
      {meetings.map(m => (
        <div key={m._id} className="py-4 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#0E121B] truncate">{m.title}</p>
                <Pill label={m.status} color={statusColor[m.status] || "default"} />
              </div>
              <p className="text-xs text-[#525866] mt-0.5">
                {m.type?.replace(/_/g, " ")} ·{" "}
                {m.preferredDate ? `Preferred: ${new Date(m.preferredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No date set"}
                {m.preferredTime ? ` at ${m.preferredTime}` : ""}
              </p>
              {m.agenda && <p className="text-xs text-[#525866] mt-1 italic">"{m.agenda}"</p>}
            </div>
            {updatingId === m._id ? (
              <Spinner size={14} />
            ) : (
              <div className="flex gap-1.5 flex-shrink-0">
                {m.status === "requested" && (
                  <button onClick={() => updateStatus(m, "confirmed")}
                    className="rounded-lg bg-[#884c2d] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#6f381a] transition-colors">
                    Confirm
                  </button>
                )}
                {m.status === "confirmed" && (
                  <button onClick={() => updateStatus(m, "completed")}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors">
                    Mark Done
                  </button>
                )}
                {["requested", "confirmed"].includes(m.status) && (
                  <button onClick={() => updateStatus(m, "cancelled")}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN PAGE ─── */

export default function ClientProjectsPage() {
  const { token } = useAuth();

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState(null);
  const [editMode, setEditMode] = useState(false); // "create" | "edit" | false
  const [rightTab, setRightTab] = useState("timeline"); // "timeline" | "meetings"

  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [deletingId, setDeletingId] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
  }

  // Load clients
  useEffect(() => {
    adminApi.getClients(token)
      .then(data => setClients(data))
      .catch(() => showToast("Could not load clients.", "error"))
      .finally(() => setClientsLoading(false));
  }, [token]);

  // Load client detail when selected
  const loadClientDetail = useCallback(async (client) => {
    setSelectedClient(client);
    setSelectedProject(null);
    setEditMode(false);
    setDetailLoading(true);
    try {
      const detail = await adminApi.getClientDetail(client._id, token);
      setClientProjects(detail.projects || []);
      setClientMeetings(detail.meetings || []);
    } catch {
      showToast("Could not load client detail.", "error");
    } finally {
      setDetailLoading(false);
    }
  }, [token]);

  function handleProjectSaved(saved) {
    setClientProjects(prev => {
      const exists = prev.some(p => p._id === saved._id);
      return exists ? prev.map(p => p._id === saved._id ? saved : p) : [saved, ...prev];
    });
    setSelectedProject(saved);
    setEditMode(false);
    showToast(editMode === "edit" ? "Project updated — client portal refreshed." : "Project created — client can see it now.");
  }

  async function handleDeleteProject(project) {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeletingId(project._id);
    try {
      await adminApi.deleteProject(project._id, token);
      setClientProjects(prev => prev.filter(p => p._id !== project._id));
      if (selectedProject?._id === project._id) {
        setSelectedProject(null);
        setEditMode(false);
      }
      showToast("Project deleted.");
    } catch (err) {
      showToast(err.message || "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleMeetingUpdated(updated) {
    setClientMeetings(prev => prev.map(m => m._id === updated._id ? updated : m));
    showToast("Meeting status updated.");
  }

  const filteredClients = clients.filter(c =>
    `${c.name} ${c.email} ${c.company || ""}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const sp = statusPill;

  /* ── render ── */

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden -m-10">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />

      {/* ── COL 1: Client List ── */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-[#E1E4EA] bg-[#F1F1F5]">
        <div className="px-4 pt-5 pb-3">
          <h2 className="text-base font-bold text-[#0E121B] mb-3 flex items-center gap-2">
            <Users size={16} className="text-[#884c2d]" />
            Clients
            {!clientsLoading && (
              <span className="ml-auto rounded-full bg-[#884c2d]/10 px-2 py-0.5 text-[10px] font-bold text-[#884c2d]">
                {clients.length}
              </span>
            )}
          </h2>
          <div className="flex h-9 items-center gap-2 rounded-xl border border-[#E1E4EA] bg-white px-3 focus-within:border-[#884c2d] focus-within:ring-2 focus-within:ring-[#C57E5B]/60">
            <Search size={13} className="text-[#525866]" />
            <input value={clientSearch} onChange={e => setClientSearch(e.target.value)}
              placeholder="Search clients…" className="w-full bg-transparent text-xs outline-none placeholder:text-[#525866]/60" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {clientsLoading ? (
            <div className="flex justify-center pt-12"><Spinner /></div>
          ) : filteredClients.length === 0 ? (
            <div className="pt-12 text-center">
              <Users size={28} className="mx-auto mb-2 text-[#525866]/30" />
              <p className="text-xs font-semibold text-[#525866]">{clientSearch ? "No matches" : "No clients yet"}</p>
              <p className="text-[11px] text-[#525866]/70 mt-1">Clients appear after paying for a package.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredClients.map(client => (
                <button
                  key={client._id}
                  onClick={() => loadClientDetail(client)}
                  className={`w-full rounded-xl p-3 text-left transition-all ${
                    selectedClient?._id === client._id
                      ? "bg-[#884c2d] text-white shadow-md"
                      : "bg-white hover:bg-[#fff1ec] text-[#0E121B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      selectedClient?._id === client._id ? "bg-white/20 text-white" : "bg-[#884c2d] text-white"
                    }`}>
                      {initials(client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${selectedClient?._id === client._id ? "text-white" : "text-[#0E121B]"}`}>
                        {client.name}
                      </p>
                      <p className={`text-[10px] truncate ${selectedClient?._id === client._id ? "text-white/70" : "text-[#525866]"}`}>
                        {client.company || client.email}
                      </p>
                    </div>
                    <ChevronRight size={13} className={selectedClient?._id === client._id ? "text-white/70" : "text-[#525866]/50"} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── COL 2: Project List ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-[#E1E4EA] bg-[#F1F1F5]">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <FolderOpen size={36} className="mb-3 text-[#525866]/25" />
            <p className="text-sm font-semibold text-[#525866]">Select a client</p>
            <p className="text-xs text-[#525866]/70 mt-1">Choose a client from the left panel to see their projects.</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-5 pb-3 border-b border-[#E1E4EA]">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#525866]">Client</p>
                  <h3 className="text-sm font-bold text-[#0E121B] truncate">{selectedClient.name}</h3>
                  <p className="text-xs text-[#525866] truncate">{selectedClient.company || selectedClient.email}</p>
                </div>
                <button
                  onClick={() => { setSelectedProject(null); setEditMode("create"); setRightTab("timeline"); }}
                  className="flex h-8 items-center gap-1.5 rounded-xl bg-[#884c2d] px-3 text-xs font-bold text-white hover:bg-[#6f381a] transition-colors flex-shrink-0"
                >
                  <Plus size={12} /> New
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              {detailLoading ? (
                <div className="flex justify-center pt-12"><Spinner /></div>
              ) : clientProjects.length === 0 ? (
                <div className="flex flex-col items-center pt-12 text-center">
                  <FolderOpen size={28} className="mb-2 text-[#525866]/30" />
                  <p className="text-xs font-semibold text-[#525866]">No projects yet</p>
                  <button
                    onClick={() => { setSelectedProject(null); setEditMode("create"); }}
                    className="mt-3 flex items-center gap-1 text-xs font-bold text-[#884c2d] hover:underline"
                  >
                    <Plus size={12} /> Create first project
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientProjects.map(p => {
                    const s = sp(p.status);
                    const isSelected = selectedProject?._id === p._id;
                    return (
                      <button
                        key={p._id}
                        onClick={() => { setSelectedProject(p); setEditMode(false); setRightTab("timeline"); }}
                        className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-[#884c2d] bg-[#fff1ec] shadow-sm"
                            : "border-[#E1E4EA] bg-white hover:border-[#884c2d]/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-bold text-[#0E121B] leading-tight">{p.name}</p>
                          <Pill label={s.label} color={s.color} />
                        </div>
                        <p className="text-[11px] text-[#525866] mb-2">{p.packageName || "No package"}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[#E1E4EA] overflow-hidden">
                            <div className="h-full rounded-full bg-[#884c2d]" style={{ width: `${p.progress || 0}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-[#884c2d]">{p.progress || 0}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── COL 3: Project Detail / Form ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F1F1F5]">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-10">
            <div className="w-16 h-16 rounded-2xl bg-[#884c2d]/10 flex items-center justify-center mb-4">
              <FolderOpen size={30} className="text-[#884c2d]" />
            </div>
            <h2 className="text-xl font-bold text-[#0E121B] mb-2">Client Projects Panel</h2>
            <p className="text-sm text-[#525866] max-w-md">
              Select a client to view their projects, create new ones, and update project stages. All changes sync instantly to the client portal.
            </p>
          </div>
        ) : editMode ? (
          /* ── Project Form ── */
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setEditMode(false)} className="p-2 rounded-xl border border-[#E1E4EA] bg-white hover:bg-[#fff1ec] transition-colors">
                  <X size={14} className="text-[#525866]" />
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#525866]">
                    {editMode === "edit" ? "Edit Project" : "New Project"} · {selectedClient.name}
                  </p>
                  <h2 className="text-lg font-bold text-[#0E121B]">
                    {editMode === "edit" ? selectedProject?.name : "Create Project"}
                  </h2>
                </div>
              </div>
              <SectionCard className="p-5">
                <ProjectForm
                  initial={editMode === "edit" ? selectedProject : null}
                  clientId={selectedClient._id}
                  token={token}
                  onSaved={handleProjectSaved}
                  onCancel={() => setEditMode(false)}
                />
              </SectionCard>
            </div>
          </div>
        ) : selectedProject ? (
          /* ── Project Detail ── */
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#F1F1F5]/90 backdrop-blur border-b border-[#E1E4EA] px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h2 className="text-lg font-bold text-[#0E121B] truncate">{selectedProject.name}</h2>
                    <Pill {...statusPill(selectedProject.status)} />
                  </div>
                  <p className="text-xs text-[#525866]">
                    {selectedProject.packageName || "No package"} · {selectedClient.name}
                    {selectedProject.expectedEndDate && ` · Due ${fmtDisplay(selectedProject.expectedEndDate)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditMode("edit")}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-[#E1E4EA] bg-white px-3 text-xs font-bold text-[#884c2d] hover:bg-[#fff1ec] transition-colors"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProject(selectedProject)}
                    disabled={deletingId === selectedProject._id}
                    className="flex h-8 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === selectedProject._id ? <Spinner size={12} /> : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-3 border-b border-[#E1E4EA]">
                {[
                  { key: "timeline", label: "Timeline & Stages" },
                  { key: "meetings", label: `Meetings ${clientMeetings.length ? `(${clientMeetings.length})` : ""}` },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setRightTab(tab.key)}
                    className={`pb-2.5 px-1 mr-4 text-xs font-bold border-b-2 transition-all ${
                      rightTab === tab.key
                        ? "border-[#884c2d] text-[#884c2d]"
                        : "border-transparent text-[#525866] hover:text-[#0E121B]"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {rightTab === "timeline" && (
                <>
                  {/* Overview */}
                  <SectionCard className="p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866] mb-4">Project Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Progress", value: `${selectedProject.progress || 0}%` },
                        { label: "Current Phase", value: selectedProject.currentPhase || "—" },
                        { label: "Start Date", value: fmtDisplay(selectedProject.startDate) },
                        { label: "Expected End", value: fmtDisplay(selectedProject.expectedEndDate) },
                      ].map(r => (
                        <div key={r.label}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#525866]">{r.label}</p>
                          <p className="text-sm font-bold text-[#0E121B] mt-0.5 truncate">{r.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-3 rounded-full bg-[#E1E4EA] overflow-hidden">
                        <div className="h-full rounded-full bg-[#884c2d] transition-all duration-700"
                          style={{ width: `${selectedProject.progress || 0}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[#884c2d]">{selectedProject.progress || 0}%</span>
                    </div>
                  </SectionCard>

                  {/* Admin notes */}
                  {selectedProject.adminNotes && (
                    <SectionCard className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">Notes for Client</h3>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">Visible</span>
                      </div>
                      <p className="text-sm text-[#0E121B] leading-relaxed">{selectedProject.adminNotes}</p>
                    </SectionCard>
                  )}

                  {/* Stages */}
                  <SectionCard>
                    <div className="px-5 py-4 border-b border-[#E1E4EA] flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">
                        Stages ({selectedProject.stages?.length || 0})
                      </h3>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">Client visible</span>
                    </div>
                    {!selectedProject.stages?.length ? (
                      <div className="flex flex-col items-center py-8 text-center px-6">
                        <p className="text-xs text-[#525866]">No stages defined. Click Edit to add stages.</p>
                        <button onClick={() => setEditMode("edit")}
                          className="mt-3 flex items-center gap-1 text-xs font-bold text-[#884c2d] hover:underline">
                          <Plus size={12} /> Add Stages
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#E1E4EA]/40">
                        {selectedProject.stages.map((stage, i) => {
                          const sp = stagePill(stage.status);
                          return (
                            <div key={i} className="px-5 py-4 flex items-start gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                stage.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                                stage.status === "in_progress" ? "bg-[#fff1ec] text-[#884c2d]" :
                                "bg-[#F1F1F5] text-[#525866]"
                              }`}>
                                {stage.status === "completed" ? <Check size={14} /> : i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="text-sm font-bold text-[#0E121B]">{stage.name}</p>
                                  <Pill label={sp.label} color={sp.color} />
                                </div>
                                {stage.notes && <p className="text-xs text-[#525866] mt-1">{stage.notes}</p>}
                                {(stage.startDate || stage.endDate) && (
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {stage.startDate && (
                                      <span className="flex items-center gap-1 text-[11px] text-[#525866]">
                                        <Calendar size={11} /> {fmtDisplay(stage.startDate)}
                                      </span>
                                    )}
                                    {stage.endDate && (
                                      <span className="flex items-center gap-1 text-[11px] text-[#525866]">
                                        → {fmtDisplay(stage.endDate)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                </>
              )}

              {rightTab === "meetings" && (
                <SectionCard>
                  <div className="px-5 py-4 border-b border-[#E1E4EA]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#525866]">Meeting Requests</h3>
                    <p className="text-xs text-[#525866]/70 mt-0.5">Approve or cancel client meeting requests from here.</p>
                  </div>
                  <MeetingsPanel
                    meetings={clientMeetings}
                    token={token}
                    onUpdated={handleMeetingUpdated}
                  />
                </SectionCard>
              )}
            </div>
          </div>
        ) : (
          /* ── Nothing selected ── */
          <div className="flex flex-col items-center justify-center flex-1 text-center px-10">
            <div className="w-14 h-14 rounded-2xl bg-[#884c2d]/10 flex items-center justify-center mb-3">
              <FolderOpen size={26} className="text-[#884c2d]" />
            </div>
            <p className="text-sm font-semibold text-[#0E121B] mb-1">Select or create a project</p>
            <p className="text-xs text-[#525866]">Pick a project from the list or create a new one.</p>
            {selectedClient && (
              <button onClick={() => setEditMode("create")}
                className="mt-4 flex items-center gap-2 rounded-xl bg-[#884c2d] px-4 py-2 text-xs font-bold text-white hover:bg-[#6f381a] transition-colors">
                <Plus size={13} /> New Project for {selectedClient.name.split(" ")[0]}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
