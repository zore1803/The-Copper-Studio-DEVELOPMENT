import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ListChecks, Palette, Code2, FlaskConical, ClipboardCheck, Rocket, Zap,
  Paperclip, UploadCloud, CheckCircle2, MessageSquare, Send, Calendar,
  Settings2, Save, ChevronDown,
} from "lucide-react";
import { Button, Card } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import { storeGet, saveProject } from "../../lib/store";
import SidePanel from "../../components/SidePanel";
import ProjectHeader from "./ProjectHeader";

const PHASES = [
  { key: "Requirement Gathering", label: "Requirement", icon: ListChecks },
  { key: "Design", label: "Design", icon: Palette },
  { key: "Development", label: "Development", icon: Code2 },
  { key: "Testing", label: "Testing", icon: FlaskConical },
  { key: "Review", label: "Review", icon: ClipboardCheck },
  { key: "Completed", label: "Deployment", icon: Rocket },
];

const STAGE_NAMES = ["Requirement Gathering", "Design", "Development", "Testing", "Review", "Delivery"];

const CLIENT_STATUSES = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const activityIcon = { upload: UploadCloud, check: CheckCircle2, comment: MessageSquare };
const PHASE_NODE_SIZE = "h-12 w-12 sm:h-14 sm:w-14";
const PHASE_NODE_HEIGHT = "h-12 sm:h-14";

function getPhaseIndex(project) {
  const direct = PHASES.findIndex((phase) => phase.key === (project.currentPhase || project.status));
  if (direct !== -1) return direct;
  if (project.progress >= 95) return 5;
  if (project.progress >= 75) return 4;
  if (project.progress >= 50) return 3;
  if (project.progress >= 25) return 2;
  if (project.progress >= 10) return 1;
  return 0;
}

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#ede0db] text-[#884c2d]">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7b6f63]">{label}</p>
        <p className="text-sm font-bold text-[#211a17]">{value || "—"}</p>
      </div>
    </div>
  );
}

function InviteCollaborators({ client }) {
  const { showToast } = useToast();
  function handleInvite(event) {
    event.preventDefault();
    const email = event.target.elements.email.value.trim();
    if (!email) return;
    showToast({ title: "Invite sent", message: `${email} can now access this project dashboard.` });
    event.target.reset();
  }
  return (
    <div className="rounded-2xl border border-[#6f381a] bg-[#884c2d] p-6 text-white shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
      <h4 className="font-display mb-2 text-lg font-semibold">Invite Collaborators</h4>
      <p className="mb-4 text-sm text-white/85">Grant the {client} team access to the real-time project dashboard.</p>
      <form onSubmit={handleInvite} className="flex items-center gap-2">
        <input
          name="email"
          type="email"
          placeholder="Email address"
          className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs placeholder:text-white/60 outline-none focus:ring-1 focus:ring-white"
        />
        <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#884c2d] transition-transform hover:scale-105">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

function ManageProjectPanel({ project, onClose, onSave }) {
  const stages = STAGE_NAMES.map(name => {
    const existing = (project.stages || []).find(s => s.name === name);
    return existing || { name, status: "not_started" };
  });

  const [form, setForm] = useState({
    progress: project.progress || 0,
    clientStatus: project.clientStatus || "in_progress",
    currentPhase: project.currentPhase || project.status || "In Progress",
    adminNotes: project.adminNotes || "",
    stages,
  });

  const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  function cycleStage(name) {
    const order = ["not_started", "in_progress", "completed"];
    setForm(prev => ({
      ...prev,
      stages: prev.stages.map(s =>
        s.name === name
          ? { ...s, status: order[(order.indexOf(s.status) + 1) % order.length] }
          : s
      ),
    }));
  }

  const stageColor = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    in_progress: "bg-[#884c2d]/10 text-[#884c2d] border-[#884c2d]/20",
    not_started: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const stageLabel = { completed: "Completed", in_progress: "In Progress", not_started: "Not Started" };

  return (
    <SidePanel
      title="Manage Project"
      subtitle="Updates are immediately visible to the client in their portal."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save & Publish</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-2">
            Overall Progress — {form.progress}%
          </label>
          <input
            type="range" min="0" max="100" step="1"
            value={form.progress}
            onChange={e => set("progress")(Number(e.target.value))}
            className="w-full accent-[#884c2d]"
          />
          <div className="mt-1.5 h-1.5 rounded-full bg-[#f3f4f6] overflow-hidden">
            <div className="h-full rounded-full bg-[#884c2d] transition-all" style={{ width: `${form.progress}%` }} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Client-Visible Status</label>
          <select
            value={form.clientStatus}
            onChange={e => set("clientStatus")(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
          >
            {CLIENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">Current Phase (Admin Label)</label>
          <select
            value={form.currentPhase}
            onChange={e => set("currentPhase")(e.target.value)}
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
          >
            {PHASES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5">
            Notes for Client
            <span className="ml-1 font-normal text-[#9ca3af]">(visible in client portal)</span>
          </label>
          <textarea
            value={form.adminNotes}
            onChange={e => set("adminNotes")(e.target.value)}
            placeholder="Share an update or message with the client…"
            rows={4}
            className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20 resize-none"
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-[#374151] mb-2">Engagement Roadmap Stages</p>
          <p className="text-[11px] text-[#9ca3af] mb-3">Tap a stage to cycle: Not Started → In Progress → Completed</p>
          <div className="space-y-2">
            {form.stages.map(stage => (
              <button
                key={stage.name}
                type="button"
                onClick={() => cycleStage(stage.name)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${stageColor[stage.status]}`}
              >
                <span>{stage.name}</span>
                <span>{stageLabel[stage.status]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

export default function ProjectDetail() {
  const { companyId, projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { records: companies } = useCrmRecords("companies");
  const [allProjects, setAllProjects] = useState(() => storeGet("projects"));
  const [managing, setManaging] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

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

  if (!company || !project) {
    return (
      <div className="rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] p-10 text-center">
        <p className="text-sm font-semibold text-[#6c6355]">We couldn't find that project for this company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  const phaseIndex = getPhaseIndex(project);
  const budgetPct = Math.min(100, Math.round(((project.budgetUsed || 0) / Math.max(project.budget || 1, 1)) * 100));

  function handleShare() {
    navigator.clipboard?.writeText(`${window.location.origin}/admin/companies/${company.id}/projects/${project.id}`);
    showToast({ title: "Link copied", message: "Project workspace link copied to clipboard." });
  }

  function handleSaveProject(updates) {
    const updatedProject = {
      ...project,
      progress: Number(updates.progress),
      clientStatus: updates.clientStatus,
      currentPhase: updates.currentPhase,
      adminNotes: updates.adminNotes,
      stages: updates.stages,
    };
    saveProject(updatedProject);
    setManaging(false);
    showToast({ title: "Project updated", message: "Progress and notes are now visible to the client." });
  }

  function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    const updatedProject = {
      ...project,
      adminNotes: noteText.trim(),
      activity: [
        { icon: "comment", text: `Admin added a note for the client`, time: "Just now" },
        ...(project.activity || []).slice(0, 9),
      ],
    };
    saveProject(updatedProject);
    setNoteText("");
    setAddingNote(false);
    showToast({ title: "Note saved", message: "Client can now see this note in their portal." });
  }

  return (
    <div className="space-y-6">
      <ProjectHeader
        company={company}
        project={project}
        activeTab="Timeline"
        onShare={handleShare}
        onNewTask={() => navigate("/admin/kanban")}
        actions={
          <Button size="sm" onClick={() => setManaging(true)}>
            <Settings2 size={14} /> Manage Project
          </Button>
        }
      />

      <section className="grid grid-cols-12 gap-5">
        <div className="col-span-12 space-y-5 lg:col-span-7 xl:col-span-8">
          <Card className="p-5 sm:p-7 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-semibold text-[#211a17]">Phase Roadmap</h3>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#6c6355]">
                  <span className="h-2 w-2 rounded-full bg-[#884c2d]" />
                  Current: {PHASES[phaseIndex]?.label || project.currentPhase}
                </span>
                <button
                  onClick={() => setManaging(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-[#d8c2b9] bg-white px-2.5 py-1 text-xs font-semibold text-[#6c6355] hover:bg-[#fff8f6] transition-colors"
                >
                  <Settings2 size={11} /> Update
                </button>
              </div>
            </div>

            <div className="flex items-center overflow-x-auto pb-1">
              {PHASES.map((phase, index) => {
                const Icon = phase.icon;
                const isDone = index < phaseIndex;
                const isCurrent = index === phaseIndex;
                const isLast = index === PHASES.length - 1;
                return (
                  <Fragment key={phase.key}>
                    <div className={`flex w-16 sm:w-20 shrink-0 flex-col items-center gap-3 text-center ${index > phaseIndex ? "opacity-45" : ""}`}>
                      <div className={`relative flex ${PHASE_NODE_SIZE} items-center justify-center`}>
                        {isCurrent ? (
                          <>
                            <div className={`grid ${PHASE_NODE_SIZE} place-items-center rounded-full border-4 border-[#884c2d] bg-[#fff8f6] text-xs font-extrabold text-[#884c2d]`}>
                              {project.progress}%
                            </div>
                            <div className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-[#fff8f6] bg-[#026769]">
                              <Zap size={11} className="text-white" />
                            </div>
                          </>
                        ) : (
                          <div className={`grid ${PHASE_NODE_SIZE} place-items-center rounded-full ${isDone ? "bg-[#884c2d] text-white shadow-lg shadow-[#884c2d]/25" : "bg-[#ede0db] text-[#6c6355]"}`}>
                            <Icon size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs sm:text-sm font-bold ${isCurrent ? "text-[#884c2d]" : "text-[#211a17]"}`}>{phase.label}</p>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide ${isCurrent ? "text-[#026769]" : "text-[#6c6355]"}`}>
                          {isDone ? "Completed" : isCurrent ? "Current" : "Upcoming"}
                        </p>
                      </div>
                    </div>
                    {!isLast && (
                      <div className={`flex ${PHASE_NODE_HEIGHT} min-w-[16px] flex-1 items-center`}>
                        <div className={`h-[2px] w-full ${index < phaseIndex ? "bg-[#884c2d]" : "bg-[#ede0db]"}`} />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="relative overflow-hidden p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#884c2d]">Critical Focus</p>
              <p className="text-sm text-[#6c6355]">View and manage tasks from the Kanban board. Open a task to set priority and assign team members.</p>
              <button
                type="button"
                onClick={() => navigate("/admin/kanban")}
                className="mt-4 text-xs font-bold text-[#884c2d] hover:underline"
              >
                Open Kanban →
              </button>
            </Card>

            <div className="flex flex-col justify-between rounded-2xl border border-[#d8c2b9] bg-[#f0ede4] p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6c6355]">Note for Client</p>
                  <button
                    onClick={() => setAddingNote(v => !v)}
                    className="text-[11px] font-bold text-[#884c2d] hover:underline"
                  >
                    {addingNote ? "Cancel" : "Edit"}
                  </button>
                </div>
                {addingNote ? (
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      placeholder="Message to show the client…"
                      rows={3}
                      className="w-full rounded-lg border border-[#d8c2b9] bg-white px-3 py-2 text-xs outline-none focus:border-[#884c2d] focus:ring-1 focus:ring-[#884c2d]/30 resize-none"
                      autoFocus
                    />
                    <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-[#884c2d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6f381a]">
                      <Save size={11} /> Save Note
                    </button>
                  </form>
                ) : (
                  <p className="text-sm italic leading-5 text-[#211a17]">
                    &ldquo;{project.adminNotes || "No note for client yet. Click Edit to add one."}&rdquo;
                  </p>
                )}
              </div>
              {!addingNote && (
                <Button variant="secondary" className="mt-6 w-full justify-center" onClick={() => navigate(`/admin/companies/${company.id}/projects/${project.id}/files`)}>
                  Open Client Workspace
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-5 lg:col-span-5 xl:col-span-4">
          <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-[#211a17]">Project Metadata</h3>
              <button
                onClick={() => setManaging(true)}
                className="flex items-center gap-1 text-xs font-semibold text-[#884c2d] hover:underline"
              >
                <Settings2 size={11} /> Edit
              </button>
            </div>
            <div className="space-y-5">
              <MetaRow icon={Calendar} label="Start Date" value={project.startDate} />
              <MetaRow icon={Calendar} label="Expected Completion" value={project.dueDate || project.expectedEndDate} />
              <MetaRow icon={ListChecks} label="Package Purchased" value={project.packagePurchased || project.packageName} />
              <div className="border-t border-[#ead8d1] pt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#6c6355]">
                  <span>Budget Usage</span>
                  <span className="text-[#211a17]">{formatINR(project.budgetUsed)} / {formatINR(project.budget)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#ede0db]">
                  <div className="h-full rounded-full bg-[#884c2d]" style={{ width: `${budgetPct}%` }} />
                </div>
              </div>
              <div className="border-t border-[#ead8d1] pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7b6f63] mb-1">Client Status</p>
                <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold ${
                  project.clientStatus === "completed" ? "bg-emerald-50 text-emerald-700" :
                  project.clientStatus === "on_hold" ? "bg-amber-50 text-amber-700" :
                  project.clientStatus === "not_started" ? "bg-gray-100 text-gray-600" :
                  "bg-[#884c2d]/10 text-[#884c2d]"
                }`}>
                  {CLIENT_STATUSES.find(s => s.value === project.clientStatus)?.label || "In Progress"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
            <h3 className="font-display mb-5 text-lg font-semibold text-[#211a17]">Activity</h3>
            <div className="space-y-5">
              {project.activity?.length ? project.activity.map((item, index) => {
                const Icon = activityIcon[item.icon] || CheckCircle2;
                return (
                  <div key={index} className="flex gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ede0db] text-[#6c6355]">
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-[#211a17]">{item.text}</p>
                      <p className="text-[10px] uppercase text-[#7b6f63]">{item.time}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-[#6c6355]">No activity recorded yet.</p>}
            </div>
          </Card>

          <InviteCollaborators client={company.name} />
        </div>
      </section>

      {managing && (
        <ManageProjectPanel
          project={project}
          onClose={() => setManaging(false)}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}
