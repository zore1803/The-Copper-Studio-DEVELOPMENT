import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2, Calendar, ChevronRight, Edit2, FileText, FolderOpen,
  Globe, Info, Link2, Linkedin, Mail, MoreVertical, Phone,
  Plus, Save, StickyNote, Target, Share2, Users, X
} from "lucide-react";
import { Avatar, Button, StatusBadge } from "../../components/ui";
import { companies as fallbackCompanies, contacts, projects } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";

const TABS = ["Overview", "Deals", "Contacts", "Invoices", "Notes", "Tasks", "Meetings", "Folder", "Calendar"];

function KpiChip({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] px-5 py-4 flex items-center gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="h-9 w-9 shrink-0 rounded-lg bg-[#f3f4f6] flex items-center justify-center">
        <Icon size={16} className="text-[#6b7280]" />
      </div>
      <div>
        <p className="text-xs text-[#6b7280] font-medium">{label}</p>
        <p className="text-base font-bold text-[#111827] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({ company, companyProjects, companyContacts }) {
  const navigate = useNavigate();
  const totalRevenue = companyProjects.reduce((s, p) => s + (Number(p.value) || 80000), 0);
  const openDeals = companyProjects.filter((p) => p.status !== "Completed").length;
  const closedDeals = companyProjects.filter((p) => p.status === "Completed").length;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-5">
        {/* Financial Overview */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#111827]">Financial Overview</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#f3f4f6] px-0">
            {[
              { label: "Total Invoiced", value: `₹${(totalRevenue).toLocaleString("en-IN")}` },
              { label: "Pending", value: "₹80,374" },
              { label: "Overdue", value: "₹80,000", color: "text-red-600" },
              { label: "Collected", value: "₹11,60,000", color: "text-emerald-600" },
            ].map((item) => (
              <div key={item.label} className="px-5 py-4">
                <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`text-base font-bold ${item.color || "text-[#111827]"}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {/* Mini chart */}
          <div className="px-5 pb-5 pt-2">
            <div className="h-24 w-full">
              <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="companyGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#884c2d" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#884c2d" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points="0,75 30,65 60,60 90,50 120,55 150,40 180,38 210,45 240,35 270,28 300,25 330,20 360,22 390,15 400,18 400,80 0,80"
                  fill="url(#companyGrad)"
                />
                <polyline
                  points="0,75 30,65 60,60 90,50 120,55 150,40 180,38 210,45 240,35 270,28 300,25 330,20 360,22 390,15"
                  fill="none" stroke="#884c2d" strokeWidth="1.5" strokeLinejoin="round"
                />
                {/* Highlighted bar */}
                <rect x="330" y="20" width="18" height="60" fill="#884c2d" opacity="0.12" rx="2" />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-[#9ca3af] mt-1">
              {["Jun", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>

        {/* Key Contacts */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="px-5 py-4 border-b border-[#f3f4f6] flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#111827]">Key Contacts ({companyContacts.length})</h4>
            <button className="text-xs font-semibold text-[#884c2d] hover:underline">View All</button>
          </div>
          {companyContacts.length ? (
            <div className="divide-y divide-[#f9fafb]">
              {companyContacts.slice(0, 3).map((c) => (
                <div key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                  <Avatar name={c.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{c.name}</p>
                    <p className="text-xs text-[#6b7280] truncate">{c.designation}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#9ca3af]">
                      <span className="flex items-center gap-1"><Mail size={10} />{c.email}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Primary</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-[#9ca3af]">No contacts linked.</div>
          )}
        </div>

        {/* Tasks & Meetings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#111827]">Tasks</h4>
              <button className="text-xs text-[#884c2d] font-semibold hover:underline">View All</button>
            </div>
            {["Send Revised Proposal", "Review contract terms", "Follow-up call"].map((t, i) => (
              <div key={t} className="flex items-center gap-2.5 py-2 border-b border-[#f9fafb] last:border-0">
                <div className="h-4 w-4 rounded border border-[#d1d5db] shrink-0" />
                <span className="text-sm text-[#374151] flex-1">{t}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  i === 0 ? "bg-red-50 text-red-600" : i === 1 ? "bg-amber-50 text-amber-600" : "bg-[#f3f4f6] text-[#6b7280]"
                }`}>
                  {i === 0 ? "High" : i === 1 ? "Medium" : "Low"}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#111827]">Meetings</h4>
              <button className="text-xs text-[#884c2d] font-semibold hover:underline">View All</button>
            </div>
            {["Product Demo", "Review Meeting", "Strategy Call"].map((m) => (
              <div key={m} className="flex items-center gap-2.5 py-2 border-b border-[#f9fafb] last:border-0">
                <div className="h-7 w-7 rounded-lg bg-[#884c2d]/10 flex items-center justify-center shrink-0">
                  <Calendar size={12} className="text-[#884c2d]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#374151] truncate">{m}</p>
                  <p className="text-[11px] text-[#9ca3af]">Tomorrow, 11:00 AM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: Activity + Calendar */}
      <div className="space-y-5">
        {/* Deal Pipeline */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-[#111827]">Deal Pipeline ({companyProjects.length})</h4>
            <button className="h-7 w-7 rounded-lg bg-[#884c2d] flex items-center justify-center text-white hover:bg-[#6f381a]">
              <Plus size={13} />
            </button>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map((stage) => (
              <div key={stage} className="shrink-0 min-w-[80px]">
                <p className="text-[10px] font-semibold text-[#9ca3af] mb-1">{stage}</p>
                <div className="rounded-lg bg-[#f9fafb] border border-[#e5e7eb] p-2 min-h-[50px]">
                  {stage === "Won" ? (
                    <div className="text-[11px] font-bold text-emerald-600">₹1,20,000</div>
                  ) : stage === "Lead" ? (
                    <div className="text-[11px] font-bold text-[#374151]">₹2,70,000</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h4 className="text-sm font-bold text-[#111827] mb-4">Activity Timeline</h4>
          <div className="space-y-3">
            {[
              { color: "bg-red-500", text: "Invoice #INV-238 is overdue", amount: "₹80,000", time: "5 May 2000" },
              { color: "bg-amber-500", text: "Deal Moved to Negotiation", amount: "₹4,50,000", time: "4 May 2000" },
              { color: "bg-emerald-500", text: "Meeting Completed", time: "3 May 2000" },
              { color: "bg-blue-500", text: "Task Completed", time: "3 May 2000" },
              { color: "bg-emerald-500", text: "Payment Received", amount: "₹50,000", time: "2 May 2000" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${item.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#374151]">{item.text}</p>
                  {item.amount && <p className="text-xs font-bold text-[#111827]">{item.amount}</p>}
                  <p className="text-[11px] text-[#9ca3af] mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h4 className="text-sm font-bold text-[#111827] mb-3">Upcoming</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /><span className="text-[#374151]">Product Demo + Meeting Scheduled</span></div>
            <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /><span className="text-[#374151]">Review Meeting + Meeting Scheduled</span></div>
            <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-red-500 shrink-0" /><span className="text-red-600 font-semibold">Invoice #INV-238 Due</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ companyContacts }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 w-72">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="bg-transparent text-sm outline-none placeholder:text-[#9ca3af] w-full" placeholder="Search by contact, email, or phone..." />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[#884c2d] px-3 text-sm font-semibold text-white hover:bg-[#6f381a]">
            <Plus size={14} /> Add Contact
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[#f3f4f6] bg-[#fafafa]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Mail size={11} />Contact Name</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Mail size={11} />Email</div>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                <div className="flex items-center gap-1.5"><Phone size={11} />Phone Number</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {companyContacts.length ? companyContacts.map((c) => (
              <tr key={c.id} className="border-b border-[#f9fafb] hover:bg-[#fafafa] transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="sm" />
                    <span className="text-sm font-medium text-[#111827]">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.email || "abc@company.com"}</td>
                <td className="px-5 py-3.5 text-sm text-[#374151]">{c.phone || "+91 1234567890"}</td>
              </tr>
            )) : (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f9fafb]">
                  <td className="px-5 py-3.5 text-sm text-[#374151]">First Name Last Name</td>
                  <td className="px-5 py-3.5 text-sm text-[#374151]">abccompany@gmail.com</td>
                  <td className="px-5 py-3.5 text-sm text-[#374151]">+91 1234567890</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#f3f4f6]">
          <p className="text-xs text-[#6b7280]">Showing <span className="font-semibold text-[#111827]">{companyContacts.length || 8}</span> Contacts</p>
          <div className="flex items-center gap-1">
            <button className="h-7 w-7 flex items-center justify-center rounded border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button className="h-7 w-7 flex items-center justify-center rounded bg-[#884c2d] text-white text-xs font-bold">1</button>
            <button className="h-7 w-7 flex items-center justify-center rounded border border-[#e5e7eb] text-[#374151] text-xs hover:bg-[#f9fafb]">2</button>
            <button className="h-7 w-7 flex items-center justify-center rounded border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealsTab({ companyProjects, companyId }) {
  const navigate = useNavigate();
  const stages = ["Onboarding", "Need Analysis", "Proposal", "Negotiation"];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: "Open Deals", value: companyProjects.filter((p) => p.status !== "Completed").length },
          { label: "Pipeline Value", value: "₹12,80,374" },
          { label: "Won Deals", value: 12 },
          { label: "Lost Deals", value: 52 },
          { label: "Avg Deal Size", value: 8 },
          { label: "Avg Closing Time", value: 2 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e5e7eb] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-xs text-[#9ca3af] font-medium">{s.label}</p>
            <p className="text-base font-bold text-[#111827] mt-1">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <div key={stage} className="shrink-0 w-64">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-semibold text-[#374151]">{stage}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#9ca3af]">6</span>
                <button className="text-[#9ca3af] hover:text-[#374151]"><MoreVertical size={13} /></button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#111827]">₹29,98,520</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+17%</span>
              </div>
              <div className="rounded-lg border border-[#f3f4f6] bg-[#fafafa] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-[#374151]">Deal Name</span>
                  <button className="text-[#9ca3af] hover:text-[#374151]"><MoreVertical size={12} /></button>
                </div>
                <p className="text-[11px] text-[#6b7280]">₹11,63,236</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-[#884c2d] flex items-center justify-center text-white text-[9px] font-bold">LG</div>
                    <span className="text-[11px] text-[#6b7280]">Landscape Gardening</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderTab({ label }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-medium text-[#9ca3af]">{label} — coming soon</p>
    </div>
  );
}

export default function CompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Overview");
  const { records: companies } = useCrmRecords("companies", fallbackCompanies);

  const company = useMemo(() => companies.find((c) => String(c.id) === companyId), [companies, companyId]);
  const companyProjects = useMemo(() => projects.filter((p) => String(p.companyId) === companyId), [companyId]);
  const companyContacts = useMemo(() => (company ? contacts.filter((c) => c.company === company.name) : []), [company]);

  if (!company) {
    return (
      <div className="m-6 rounded-xl border border-[#e5e7eb] bg-white p-12 text-center">
        <p className="text-sm font-semibold text-[#6b7280]">Company not found.</p>
        <button onClick={() => navigate("/admin/companies")} className="mt-4 text-sm font-semibold text-[#884c2d] hover:underline">
          ← Back to Companies
        </button>
      </div>
    );
  }

  const totalRevenue = companyProjects.reduce((s, p) => s + (Number(p.value) || 80000), 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Company Hero */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 rounded-full bg-[#f3f4f6] border border-[#e5e7eb] flex items-center justify-center">
                <Building2 size={20} className="text-[#9ca3af]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111827]">{company.name}</h2>
                <p className="text-sm text-[#6b7280]">{company.industry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Info size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Twitter size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Linkedin size={14} /></button>
              <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]"><Instagram size={14} /></button>
              <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm font-medium text-[#374151] hover:bg-[#f9fafb]">
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => showToast({ title: "Coming soon", message: "New entry creation is on the roadmap." })}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#884c2d] px-3 text-sm font-semibold text-white hover:bg-[#6f381a]"
              >
                New Entry <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* KPI chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-6 pb-4">
          <KpiChip label="Lifetime Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={Target} />
          <KpiChip label="Outstanding" value="₹80,374" icon={FileText} />
          <KpiChip label="Open Deals" value={companyProjects.filter((p) => p.status !== "Completed").length} icon={Target} />
          <KpiChip label="Closed Deals" value={companyProjects.filter((p) => p.status === "Completed").length} icon={Target} />
          <KpiChip label="Upcoming Tasks" value={8} icon={StickyNote} />
          <KpiChip label="Upcoming Meetings" value={2} icon={Calendar} />
        </div>

        {/* Tabs */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#884c2d] text-[#884c2d]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151]"
              }`}
            >
              {tab}
            </button>
          ))}
          <button className="ml-auto p-2 text-[#9ca3af] hover:text-[#374151]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-6">
        {activeTab === "Overview" && <OverviewTab company={company} companyProjects={companyProjects} companyContacts={companyContacts} />}
        {activeTab === "Deals" && <DealsTab companyProjects={companyProjects} companyId={companyId} />}
        {activeTab === "Contacts" && <ContactsTab companyContacts={companyContacts} />}
        {activeTab !== "Overview" && activeTab !== "Deals" && activeTab !== "Contacts" && (
          <PlaceholderTab label={activeTab} />
        )}
      </div>
    </div>
  );
}
