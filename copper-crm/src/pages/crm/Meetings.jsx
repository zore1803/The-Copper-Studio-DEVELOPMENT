import { useEffect, useMemo, useState } from "react";
import {
  Calendar, Check, ChevronLeft, ChevronRight, Clock, Copy, List, Search, Video, X
} from "lucide-react";
import { Badge } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useAuth } from "../../auth/useAuth";
import { apiGet } from "../../lib/api";
import { adminApi } from "../../lib/clientApi";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import FilterButton from "../../components/FilterButton";
import MobileListCard from "../../components/MobileListCard";

const PAGE_SIZE = 25;

const MEETING_TYPE_LABELS = {
  discovery_session: "Discovery Session",
  strategy_call: "Strategy Call",
  review_call: "Review Call",
  onboarding: "Onboarding",
};

function meetingTypeLabel(type) {
  return MEETING_TYPE_LABELS[type] || type || "Meeting";
}

const STATUS_BADGE = {
  requested: { color: "orange", label: "Requested" },
  confirmed: { color: "orange", label: "Confirmed" },
  completed: { color: "green", label: "Completed" },
  cancelled: { color: "red", label: "Cancelled" },
};

function statusBadge(status) {
  return STATUS_BADGE[status] || { color: "gray", label: status || "Unknown" };
}

function formatDateTime(value) {
  if (!value) return "Awaiting confirmation";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Awaiting confirmation";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}

function EmptyState({ title, text }) {
  return (
    <div className="rounded-xl border border-dashed border-[#E1E4EA] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff1ec] text-[#8D3118]">
        <Video size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>
    </div>
  );
}

const GOOGLE_CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID || "";
const GOOGLE_CALENDAR_TZ = import.meta.env.VITE_GOOGLE_CALENDAR_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

// Read-only view of whatever calendar Calendly books meetings into — no
// custom event list to maintain, Google renders its own up-to-date UI.
function GoogleCalendarEmbed() {
  if (!GOOGLE_CALENDAR_ID) {
    return (
      <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] p-6 text-sm text-[#6b7280]">
        <p className="font-semibold text-[#374151]">Google Calendar isn't connected yet.</p>
        <p className="mt-1">
          Set <code className="rounded bg-[#eef2f6] px-1 py-0.5 text-xs">VITE_GOOGLE_CALENDAR_ID</code> to the calendar Calendly books meetings into.
        </p>
      </div>
    );
  }
  const src = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(GOOGLE_CALENDAR_ID)}&ctz=${encodeURIComponent(GOOGLE_CALENDAR_TZ)}`;
  return <iframe src={src} title="Google Calendar" className="h-[720px] w-full rounded-xl border border-[#e5e7eb]" frameBorder="0" scrolling="no" />;
}

// A meeting's "client" and "company" columns aren't stored as plain strings —
// clientId is populated server-side (name/email) but companyId is a raw ref,
// so map it against the companies list already loaded for every other admin
// page. Falls back to the first Calendly participant when there's no linked
// portal account (e.g. a guest who booked before being added as a contact).
function useCompanyNames() {
  const { records: companies } = useCrmRecords("companies");
  return useMemo(() => new Map(companies.map((c) => [String(c._id || c.id), c.name])), [companies]);
}

export default function Meetings() {
  const { token } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const companyNames = useCompanyNames();
  const { showToast } = useToast();

  async function updateStatus(meeting, status) {
    setUpdatingId(meeting._id);
    try {
      // Only patch `status` locally rather than merging the server's response —
      // the PUT endpoint returns the Meeting doc with a raw clientId, not the
      // populated {name, email} object the GET route provides, and merging it
      // in would wipe out the client name already shown in this list/panel.
      await adminApi.updateMeeting(meeting._id, { status }, token);
      setMeetings((prev) => prev.map((m) => (m._id === meeting._id ? { ...m, status } : m)));
      setSelected((prev) => (prev && prev._id === meeting._id ? { ...prev, status } : prev));
      showToast({ title: "Meeting updated", message: `${meeting.title || "Meeting"} is now ${status}.` });
    } catch (err) {
      showToast({ type: "error", title: "Could not update meeting", message: err.message });
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    let alive = true;
    apiGet("/api/admin/meetings", token)
      .then((data) => { if (alive) { setMeetings(Array.isArray(data) ? data : []); setError(""); } })
      .catch((err) => { if (alive) setError(err.message || "Failed to load meetings."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [token]);

  function clientNameFor(meeting) {
    return meeting.clientId?.name || meeting.participants?.[0]?.name || meeting.participants?.[0]?.email || "Not linked";
  }
  function companyNameFor(meeting) {
    return companyNames.get(String(meeting.companyId)) || "Not linked";
  }

  const typeOptions = useMemo(() => [
    "All",
    ...Array.from(new Set(meetings.map((m) => m.type).filter(Boolean)))
      .sort((a, b) => meetingTypeLabel(a).localeCompare(meetingTypeLabel(b)))
      .map((value) => ({ value, label: meetingTypeLabel(value) }))
  ], [meetings]);
  const companyOptions = useMemo(
    () => ["All", ...Array.from(new Set(meetings.map((m) => companyNameFor(m)).filter((name) => name && name !== "Not linked"))).sort((a, b) => a.localeCompare(b))],
    [meetings, companyNames]
  );

  const filtered = useMemo(() => meetings.filter((m) => {
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    const matchesType = typeFilter === "All" || m.type === typeFilter;
    const matchesCompany = companyFilter === "All" || companyNameFor(m) === companyFilter;
    const participantText = (m.participants || []).map((p) => `${p.name || ""} ${p.email || ""}`).join(" ");
    const haystack = [
      m.title,
      clientNameFor(m),
      companyNameFor(m),
      meetingTypeLabel(m.type),
      m.status,
      m.meetingLink,
      m.agenda,
      m.notes,
      m.clientId?.email,
      participantText,
      formatDateTime(m.scheduledAt)
    ].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && matchesType && matchesCompany && haystack.includes(query.toLowerCase());
  }), [meetings, statusFilter, typeFilter, companyFilter, query, companyNames]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.scheduledAt || b.createdAt || 0) - new Date(a.scheduledAt || a.createdAt || 0)),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-full bg-[#FFFFFF]">
      <div className="flex flex-col gap-4 border-b border-[#E1E4EA] bg-white px-6 py-3 lg:h-14 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:py-0">
        <div>
          <h1 className="text-base font-medium text-[#0E121B]">Meetings</h1>
          <p className="text-xs text-[#525866] mt-0.5">Every meeting scheduled across all clients and companies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-full items-center gap-2 rounded-full border border-[#E1E4EA] px-3 sm:w-72 transition-colors focus-within:border-[#8D3118] focus-within:bg-[#fff8f6]">
            <Search size={14} className="text-[#525866] shrink-0" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#525866]"
              placeholder="Search by meeting, client, or company…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <FilterButton
            buttonClassName="h-8 w-8"
            onReset={() => { setStatusFilter("All"); setTypeFilter("All"); setCompanyFilter("All"); }}
            fields={[
              { key: "status", label: "Status", type: "select", value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, options: ["All", "requested", "confirmed", "completed", "cancelled"] },
              { key: "type", label: "Type", type: "select", value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); }, options: typeOptions },
              { key: "company", label: "Company", type: "select", value: companyFilter, onChange: (v) => { setCompanyFilter(v); setPage(1); }, options: companyOptions }
            ]}
          />
          {/* List / Calendar view toggle */}
          <div className="flex h-8 items-center rounded-full border border-[#E1E4EA] bg-white p-0.5">
            <button
              onClick={() => setView("list")}
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${view === "list" ? "bg-[#8D3118] text-white" : "text-[#525866] hover:bg-[#f9fafb]"}`}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${view === "calendar" ? "bg-[#8D3118] text-white" : "text-[#525866] hover:bg-[#f9fafb]"}`}
            >
              <Calendar size={14} /> Calendar
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 xl:p-6">
        {view === "calendar" ? (
          <GoogleCalendarEmbed />
        ) : (
          <section className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
            {loading ? (
              <div className="p-10 text-center text-sm text-[#6b7280]">Loading meetings…</div>
            ) : error ? (
              <div className="p-10 text-center text-sm text-red-600">Couldn't load meetings: {error}</div>
            ) : sorted.length ? (
              <>
                {/* Mobile: one card per meeting */}
                <div className="flex flex-col gap-3 p-4 sm:hidden">
                  {paginated.map((m) => (
                    <MobileListCard
                      key={m._id}
                      title={m.title}
                      subtitle={`${clientNameFor(m)} · ${companyNameFor(m)}`}
                      badge={<Badge color={statusBadge(m.status).color}>{statusBadge(m.status).label}</Badge>}
                      onClick={() => setSelected(m)}
                      fields={[
                        { label: "Type", value: meetingTypeLabel(m.type) },
                        { label: "Date / Time", value: formatDateTime(m.scheduledAt) },
                      ]}
                    />
                  ))}
                </div>

                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#8D3118] border-b border-[#6E2412]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Meeting</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Company</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-white">Date / Time</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-white">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3f4f6]">
                      {paginated.map((m) => (
                        <tr key={m._id} className="cursor-pointer hover:bg-[#fafafa]" onClick={() => setSelected(m)}>
                          <td className="px-4 py-3 text-sm font-semibold text-[#111827]">{m.title}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{clientNameFor(m)}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{companyNameFor(m)}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{meetingTypeLabel(m.type)}</td>
                          <td className="px-4 py-3 text-sm text-[#374151]">{formatDateTime(m.scheduledAt)}</td>
                          <td className="px-4 py-3 text-center"><Badge color={statusBadge(m.status).color}>{statusBadge(m.status).label}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex h-14 items-center justify-between px-6 border-t border-[#E1E4EA]">
                  <p className="text-sm text-[#6b7280]">
                    Showing <span className="font-semibold text-[#111827]">{paginated.length}</span> of{" "}
                    <span className="font-semibold text-[#111827]">{sorted.length}</span> Meetings
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                          p === safePage ? "bg-[#8D3118] text-white" : "border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState title="No meetings yet." text="Meetings booked through Calendly or the client portal will appear here." />
            )}
          </section>
        )}
      </div>

      {selected && (
        <SidePanel title={selected.title} subtitle={meetingTypeLabel(selected.type)} onClose={() => setSelected(null)}>
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-xs text-[#6b7280]">
              <Clock size={15} />
              {formatDateTime(selected.scheduledAt)}
              {selected.duration ? ` (${selected.duration} mins)` : ""}
            </div>

            <div className="flex items-center gap-2">
              <Badge color={statusBadge(selected.status).color}>{statusBadge(selected.status).label}</Badge>
            </div>

            {selected.status !== "completed" && selected.status !== "cancelled" && (
              <div className="flex gap-2">
                <button
                  disabled={updatingId === selected._id}
                  onClick={() => updateStatus(selected, "completed")}
                  className="flex items-center gap-1.5 rounded-full bg-[#8D3118] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Check size={13} /> Mark Completed
                </button>
                <button
                  disabled={updatingId === selected._id}
                  onClick={() => updateStatus(selected, "cancelled")}
                  className="flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <X size={13} /> Cancel Meeting
                </button>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold mb-2 text-[#374151]">Client</p>
              <p className="text-sm text-[#111827]">{clientNameFor(selected)}</p>
              <p className="text-xs text-[#6b7280]">{companyNameFor(selected)}</p>
            </div>

            {selected.meetingLink && selected.status !== "cancelled" && (
              <div>
                <p className="text-xs font-semibold mb-2 text-[#374151]">Meeting Link</p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fafafa]">
                  <code className="text-xs flex-1 truncate text-[#8D3118]">{selected.meetingLink}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(selected.meetingLink)}
                    className="p-1 rounded text-[#8D3118] transition-colors"
                    title="Copy link">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}

            {selected.agenda && (
              <div>
                <p className="text-xs font-semibold mb-2 text-[#374151]">Agenda / Notes</p>
                <p className="text-sm leading-relaxed text-[#111827]">{selected.agenda}</p>
              </div>
            )}

            {selected.participants?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-3 text-[#374151]">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {selected.participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e5e7eb] bg-[#fafafa]">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#fff1ec] text-[#8D3118]">
                        {p.initials || p.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-[#111827]">{p.name}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e5e7eb] bg-[#fafafa]">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[#8D3118]">CS</div>
                    <span className="text-xs font-medium text-[#111827]">Copper Studio</span>
                  </div>
                </div>
              </div>
            )}

            {selected.status === "confirmed" && selected.meetingLink && (
              <a href={selected.meetingLink} target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#8D3118] hover:opacity-90 transition-opacity">
                <Video size={16} /> Join Video Call
              </a>
            )}
          </div>
        </SidePanel>
      )}
    </div>
  );
}
