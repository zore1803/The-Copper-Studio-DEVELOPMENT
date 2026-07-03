import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { apiGet } from "../../lib/api";
import { storeGet, storeSet } from "../../lib/store";
import { useClientProject, belongsToProject } from "../../context/ClientProjectContext";
import { useRevalidate } from "../../hooks/useRevalidate";
import {
  Package, Activity, Video, ArrowRight, CheckCircle2, CircleDot, Circle,
  Loader2,
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border p-5 flex items-center gap-4"
      style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + "15" }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>{label}</p>
      </div>
    </div>
  );
}

function ActivityDot({ active }) {
  return (
    <div className="w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center flex-shrink-0"
      style={{
        background: "var(--cs-surface-container-lowest)",
        borderColor: active ? "var(--cs-primary)" : "var(--cs-outline-variant)"
      }}>
      <div className="w-2 h-2 rounded-full" style={{ background: active ? "var(--cs-primary)" : "var(--cs-outline-variant)" }} />
    </div>
  );
}

export default function ClientDashboard() {
  const auth = useAuth();
  const token = auth.token;
  const user = auth.user;
  // The stored name can carry a salutation baked in (e.g. "Mr. Rohit Zore"),
  // so just taking the first word greeted people with "Hello, Mr." — strip
  // common salutations before picking the first name.
  const name = user?.name?.replace(/^(mr|mrs|ms|miss|dr|prof)\.?\s+/i, "").trim().split(" ")[0] || "there";

  const { projects, selectedProject, selectedId } = useClientProject();
  // Paint instantly from cache (same pattern as the admin side's
  // useCrmRecords) instead of showing a blank/spinner state until the
  // network round trip resolves — revalidates in the background.
  const [allOrders, setAllOrders] = useState(() => storeGet("orders"));
  const [allMeetings, setAllMeetings] = useState(() => storeGet("meetings"));
  const [loading, setLoading] = useState(() => storeGet("orders").length === 0 && storeGet("meetings").length === 0);

  // Call the API directly rather than clientApi.getOrders/getMeetings, which
  // swallow every failure (including a transient cold-start timeout on the
  // free-tier backend) and silently resolve with stale cached data.
  const loadDashboardData = useCallback(() => {
    return Promise.all([
      apiGet("/api/client/orders", token).catch(() => null),
      apiGet("/api/client/meetings", token).catch(() => null),
    ]).then(([o, m]) => {
      if (Array.isArray(o)) { storeSet("orders", o); setAllOrders(o); }
      if (Array.isArray(m)) { storeSet("meetings", m); setAllMeetings(m); }
    });
  }, [token]);

  useEffect(() => {
    loadDashboardData().finally(() => setLoading(false));
  }, [loadDashboardData]);

  // Revalidate on focus/interval so admin-side changes (new orders, meetings,
  // project updates) show up without the client having to hard-refresh.
  useRevalidate(loadDashboardData);

  // The summary cards and purchases list show the whole account; meetings
  // and the active-project card scope to the project chosen in the switcher.
  const meetings = useMemo(() => allMeetings.filter(m => belongsToProject(m, selectedId)), [allMeetings, selectedId]);

  const activeProject = selectedProject;
  const upcomingMeeting = meetings.find(m => m.status === "confirmed") || meetings[0];

  // A single recency-ordered feed merged from everything the dashboard already
  // loads (and revalidates) — meetings, purchases, and per-project progress —
  // so any new activity of any kind surfaces at the top, instead of only ever
  // showing the two newest meetings plus one fixed project line.
  const recentActivity = useMemo(() => {
    const items = [];
    for (const m of meetings) {
      const when = m.updatedAt || m.createdAt;
      if (!when) continue;
      items.push({
        key: `meeting-${m._id || m.id}`,
        title: m.status === "requested" ? "Meeting requested" : m.status === "confirmed" ? "Meeting confirmed" : m.status === "cancelled" ? "Meeting cancelled" : "Meeting update",
        detail: m.title || "Meeting",
        time: new Date(when),
      });
    }
    for (const o of allOrders) {
      if (!o.createdAt) continue;
      items.push({
        key: `order-${o._id || o.id}`,
        title: "Package purchased",
        detail: o.package?.name || o.packageName || "New order",
        time: new Date(o.createdAt),
      });
    }
    for (const p of projects) {
      const when = p.updatedAt || p.createdAt;
      if (!when) continue;
      items.push({
        key: `project-${p._id || p.id}`,
        title: "Project update",
        detail: `${p.name} · ${p.progress || 0}% complete`,
        time: new Date(when),
      });
    }
    return items
      .filter((it) => !Number.isNaN(it.time.getTime()))
      .sort((a, b) => b.time - a.time)
      .slice(0, 5);
  }, [meetings, allOrders, projects]);

  const stats = [
    { icon: Package, label: "Total Packages", value: allOrders.length || "—", color: "var(--cs-primary)" },
    { icon: Activity, label: "Live Projects", value: projects.length || "—", color: "#4caf50" },
    { icon: Video, label: "Upcoming Meetings", value: allMeetings.filter(m => m.status === "confirmed").length || "—", color: "#ff9800" },
  ];

  return (
    <div className="p-5 xl:p-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Hello, {name} 👋</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--cs-secondary)" }}>Here's an overview of your current projects with the Copper Studio.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Current Project Status */}
      <div className="mb-6">
          <div className="rounded-xl border p-6" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--cs-secondary)" }}>Current Project</p>
                <h3 className="text-xl font-bold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {activeProject?.name || "No active project"}
                </h3>
                {activeProject?.packageName && (
                  <p className="text-sm mt-0.5" style={{ color: "var(--cs-secondary)" }}>{activeProject.packageName}</p>
                )}
              </div>
              <Link to="/client/projects" className="text-xs font-semibold flex items-center gap-1 hover:underline"
                style={{ color: "var(--cs-primary)" }}>
                View details
                <ArrowRight size={14} />
              </Link>
            </div>

            {activeProject ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: "var(--cs-on-surface)" }}>
                    Current Phase: <span className="font-semibold" style={{ color: "var(--cs-primary)" }}>
                      {activeProject.currentPhase || "In Progress"}
                    </span>
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--cs-primary)" }}>{activeProject.progress || 0}%</span>
                </div>
                <div className="relative w-full rounded-full border p-[3px]" style={{ background: "var(--cs-surface-container-low)", borderColor: "var(--cs-outline-variant)" }}>
                  <div className="relative h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${activeProject.progress || 0}%`,
                      minWidth: activeProject.progress ? "0.625rem" : 0,
                      background: "linear-gradient(90deg, #8D3118, #b1512f)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.25), 0 1px 2px rgba(141,49,24,0.35)",
                    }}
                  >
                    {/* A knob at the fill's leading edge signals the bar is still
                        moving toward completion, not a static/finished state. */}
                    {activeProject.progress > 0 && activeProject.progress < 100 && (
                      <span
                        className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2"
                        style={{
                          right: "-3px",
                          transform: "translateY(-50%)",
                          background: "#8D3118",
                          borderColor: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Stages */}
                {activeProject.stages?.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {activeProject.stages.map((stage, i) => {
                      const StageIcon = stage.status === "completed" ? CheckCircle2 : stage.status === "review" || stage.status === "in_progress" ? CircleDot : Circle;
                      const iconColor = stage.status === "completed" ? "#4caf50" : stage.status === "review" ? "#7c3aed" : stage.status === "in_progress" ? "var(--cs-primary)" : "#9ca3af";
                      const badge = {
                        completed: { label: "Done", background: "#e8f5e9", color: "#388e3c" },
                        review: { label: "In Review", background: "#ede9fe", color: "#7c3aed" },
                        in_progress: { label: "Active", background: "var(--cs-primary-fixed)", color: "var(--cs-primary)" },
                        not_started: { label: "Not Started", background: "var(--cs-surface-container-low)", color: "#9ca3af" }
                      }[stage.status];
                      // Only surface a stage's note to the client when the admin
                      // has left the stage marked client-visible.
                      const showNote = stage.clientVisible !== false && stage.notes;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <StageIcon size={18} className="mt-0.5 shrink-0" style={{ color: iconColor }} />
                          <div className="min-w-0 flex-1">
                            <span className="text-sm" style={{
                              color: stage.status === "completed" || stage.status === "in_progress" ? "var(--cs-on-surface)" : "var(--cs-secondary)",
                              fontWeight: stage.status === "in_progress" ? 600 : 400
                            }}>{stage.name}</span>
                            {showNote && (
                              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--cs-secondary)" }}>{stage.notes}</p>
                            )}
                          </div>
                          {badge && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: badge.background, color: badge.color }}>{badge.label}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity size={40} strokeWidth={1.5} className="mb-2" style={{ color: "var(--cs-outline-variant)" }} />
                <p className="text-sm" style={{ color: "var(--cs-secondary)" }}>No active project yet. Your project will appear here once setup is complete.</p>
              </div>
            )}
          </div>
      </div>

      {/* Upcoming meetings + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming meeting */}
        <div className="rounded-xl border p-5" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
          <h3 className="font-semibold mb-3" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Upcoming Meetings</h3>
          {upcomingMeeting ? (
            <div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--cs-primary-fixed)", color: "var(--cs-primary)" }}>
                  <Video size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm" style={{ color: "var(--cs-on-surface)" }}>{upcomingMeeting.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>
                    {upcomingMeeting.scheduledAt
                      ? new Date(upcomingMeeting.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "TBD"}
                  </p>
                </div>
              </div>
              {upcomingMeeting.meetingLink && (
                <a href={upcomingMeeting.meetingLink} target="_blank" rel="noreferrer"
                  className="mt-3 w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all"
                  style={{ background: "var(--cs-primary)", color: "var(--cs-on-primary)" }}>
                  <Video size={18} />
                  Join Call
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-4 flex flex-col items-center">
              <Video size={36} strokeWidth={1.5} className="mb-2" style={{ color: "var(--cs-outline-variant)" }} />
              <p className="text-xs" style={{ color: "var(--cs-secondary)" }}>No upcoming meetings.</p>
              <Link to="/client/meetings" className="mt-2 inline-block text-xs font-semibold hover:underline" style={{ color: "var(--cs-primary)" }}>
                Request a meeting →
              </Link>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border p-5" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Recent Activity</h3>
          <div className="relative space-y-4">
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5" style={{ background: "var(--cs-outline-variant)" }} />
            {loading ? (
              <p className="text-xs ml-7" style={{ color: "var(--cs-secondary)" }}>Loading…</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-xs ml-7" style={{ color: "var(--cs-secondary)" }}>No recent activity.</p>
            ) : (
              recentActivity.map((item, i) => (
                <div key={item.key} className="relative flex gap-4 items-start">
                  <ActivityDot active={i === 0} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--cs-on-surface)" }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>
                      {item.detail} · {item.time.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Project List */}
      <div className="rounded-xl border mb-6" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--cs-outline-variant)" }}>
          <h3 className="font-semibold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>All Project List</h3>
          <Link to="/client/projects" className="text-xs font-semibold flex items-center gap-1 hover:underline"
            style={{ color: "var(--cs-primary)" }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--cs-outline-variant)" }}>
          {projects.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: "var(--cs-secondary)" }}>No projects yet.</p>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p._id || p.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--cs-on-surface)" }}>{p.name}</p>
                  {p.packageName && <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>{p.packageName}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-24 h-2 rounded-full overflow-hidden hidden sm:block" style={{ background: "var(--cs-surface-container-low)" }}>
                    <div className="h-full rounded-full" style={{ width: `${p.progress || 0}%`, background: "var(--cs-primary-container)" }} />
                  </div>
                  <span className="text-xs font-bold w-9 text-right" style={{ color: "var(--cs-primary)" }}>{p.progress || 0}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Purchases */}
      <div className="rounded-xl border" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--cs-outline-variant)" }}>
          <h3 className="font-semibold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>All Purchases</h3>
          <Link to="/client/invoices" className="text-xs font-semibold flex items-center gap-1 hover:underline"
            style={{ color: "var(--cs-primary)" }}>
            View invoices <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--cs-outline-variant)" }}>
          {loading ? (
            <div className="p-6 text-center flex justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--cs-primary)" }} />
            </div>
          ) : allOrders.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: "var(--cs-secondary)" }}>No purchases yet.</p>
            </div>
          ) : (
            allOrders.map((o) => (
              <div key={o._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--cs-on-surface)" }}>{o.package?.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>
                    {o.payment?.invoiceId} · {o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: "var(--cs-on-surface)" }}>
                    ₹{o.package?.total?.toLocaleString("en-IN") || "—"}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: o.payment?.status === "paid" ? "#e8f5e9" : "var(--cs-primary-fixed)",
                      color: o.payment?.status === "paid" ? "#388e3c" : "var(--cs-primary)"
                    }}>
                    {o.payment?.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
