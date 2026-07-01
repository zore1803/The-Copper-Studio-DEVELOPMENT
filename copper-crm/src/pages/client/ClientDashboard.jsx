import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { clientApi } from "../../lib/clientApi";
import { useClientProject, belongsToProject, orderBelongsToProject } from "../../context/ClientProjectContext";
import {
  Package, Activity, Video, ArrowRight, CheckCircle2, CircleDot, Circle,
  Loader2, FileText, ReceiptText,
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
  const name = user?.name?.split(" ")[0] || "there";

  const { projects, selectedProject, selectedId } = useClientProject();
  const [allOrders, setAllOrders] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      clientApi.getOrders(token).catch(() => []),
      clientApi.getMeetings(token).catch(() => []),
    ]).then(([o, m]) => {
      setAllOrders(o);
      setAllMeetings(m);
    }).finally(() => setLoading(false));
  }, [token]);

  // The summary cards show the whole account (every project & package bought);
  // the detail sections below scope to the project chosen in the switcher.
  const orders = useMemo(() => allOrders.filter(o => orderBelongsToProject(o, selectedProject)), [allOrders, selectedProject]);
  const meetings = useMemo(() => allMeetings.filter(m => belongsToProject(m, selectedId)), [allMeetings, selectedId]);

  const activeProject = selectedProject;
  const upcomingMeeting = meetings.find(m => m.status === "confirmed") || meetings[0];

  const stats = [
    { icon: Package, label: "Packages Purchased", value: allOrders.length || "—", color: "var(--cs-primary)" },
    { icon: Activity, label: "Projects", value: projects.length || "—", color: "#C55418" },
    { icon: Video, label: "Upcoming Meetings", value: allMeetings.filter(m => m.status === "confirmed").length || "—", color: "#C55418" },
  ];

  return (
    <div className="p-5 xl:p-6 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Hello, {name} 👋</h1>
        <p className="mt-0.5 text-xs" style={{ color: "var(--cs-secondary)" }}>Here's an overview of your current engagement with The Copper Studio.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project progress */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active project card */}
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
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--cs-surface-container-low)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${activeProject.progress || 0}%`, background: "var(--cs-primary-container)" }} />
                </div>
                {/* Stages */}
                {activeProject.stages?.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {activeProject.stages.map((stage, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {(() => {
                          const StageIcon = stage.status === "completed" ? CheckCircle2 : stage.status === "in_progress" ? CircleDot : Circle;
                          return <StageIcon size={18} style={{ color: stage.status === "completed" ? "#C55418" : stage.status === "in_progress" ? "var(--cs-primary)" : "var(--cs-outline-variant)" }} />;
                        })()}
                        <span className="text-sm" style={{
                          color: stage.status === "completed" ? "var(--cs-on-surface)" : stage.status === "in_progress" ? "var(--cs-on-surface)" : "var(--cs-secondary)",
                          fontWeight: stage.status === "in_progress" ? 600 : 400
                        }}>{stage.name}</span>
                        {stage.status === "completed" && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "#FFFFFF", color: "#C55418" }}>Done</span>
                        )}
                        {stage.status === "in_progress" && (
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "var(--cs-primary-fixed)", color: "var(--cs-primary)" }}>Active</span>
                        )}
                      </div>
                    ))}
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

          {/* Orders */}
          <div className="rounded-xl border" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--cs-outline-variant)" }}>
              <h3 className="font-semibold" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>My Purchases</h3>
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
              ) : orders.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm" style={{ color: "var(--cs-secondary)" }}>No purchases yet.</p>
                </div>
              ) : (
                orders.slice(0, 3).map((o) => (
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
                          background: o.payment?.status === "paid" ? "#FFFFFF" : "var(--cs-primary-fixed)",
                          color: o.payment?.status === "paid" ? "#C55418" : "var(--cs-primary)"
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

        {/* Right column */}
        <div className="space-y-5">
          {/* Next meeting */}
          <div className="rounded-xl border p-5" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
            <h3 className="font-semibold mb-3" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Next Meeting</h3>
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
              ) : !activeProject && meetings.length === 0 ? (
                <p className="text-xs ml-7" style={{ color: "var(--cs-secondary)" }}>No recent activity.</p>
              ) : (
                <>
                  {meetings.slice(0, 2).map((m, i) => (
                    <div key={i} className="relative flex gap-4 items-start">
                      <ActivityDot active={i === 0} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: "var(--cs-on-surface)" }}>
                          {m.status === "requested" ? "Meeting requested" : m.status === "confirmed" ? "Meeting confirmed" : "Meeting update"}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>
                          {m.title} · {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activeProject && (
                    <div className="relative flex gap-4 items-start">
                      <ActivityDot active={meetings.length === 0} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium" style={{ color: "var(--cs-on-surface)" }}>Project update</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--cs-secondary)" }}>
                          {activeProject.name} · {activeProject.progress || 0}% complete
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-xl border p-5" style={{ background: "var(--cs-surface-container-lowest)", borderColor: "var(--cs-outline-variant)" }}>
            <h3 className="font-semibold mb-3" style={{ color: "var(--cs-on-surface)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Quick Actions</h3>
            <div className="space-y-2">
              {[
                { Icon: Video, label: "Request a meeting", to: "/client/meetings" },
                { Icon: FileText, label: "View documents", to: "/client/documents" },
                { Icon: ReceiptText, label: "View invoices", to: "/client/invoices" },
              ].map((link) => (
                <Link key={link.to} to={link.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium"
                  style={{ color: "var(--cs-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--cs-surface-container-low)"; e.currentTarget.style.color = "var(--cs-primary)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--cs-secondary)"; }}>
                  <link.Icon size={18} />
                  {link.label}
                  <ArrowRight size={16} className="ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
