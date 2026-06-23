import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, ChevronLeft, Globe, Mail, MessageCircle, Pencil, Phone, Save, Trash2 } from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";
import ContactExportMenu from "../../components/ContactExportMenu";
import { contactFullName } from "../../lib/contacts";

const TABS = ["Overview", "Notes"];

function LinkedInGlyph(props) {
  return (
    <svg viewBox="0 0 56 56" {...props}>
      <circle cx="28" cy="28" r="28" fill="#1877B5" />
      <g transform="translate(14,14) scale(1.16667)">
        <path
          fill="#fff"
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM3.558 20.452h3.564V9H3.558v11.452z"
        />
      </g>
    </svg>
  );
}

function InstagramGlyph(props) {
  return (
    <svg viewBox="0 0 56 56" {...props}>
      <defs>
        <linearGradient id="igGradientContact" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FED576" />
          <stop offset="25%" stopColor="#F47133" />
          <stop offset="50%" stopColor="#BC3081" />
          <stop offset="75%" stopColor="#C92F88" />
          <stop offset="100%" stopColor="#8B3AB5" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="14" fill="url(#igGradientContact)" />
      <rect x="14" y="14" width="28" height="28" rx="8" fill="none" stroke="#fff" strokeWidth="2.6" />
      <circle cx="28" cy="28" r="7.2" fill="none" stroke="#fff" strokeWidth="2.6" />
      <circle cx="37.2" cy="18.8" r="1.9" fill="#fff" />
    </svg>
  );
}

function FacebookGlyph(props) {
  return (
    <svg viewBox="0 0 56 56" {...props}>
      <circle cx="28" cy="28" r="28" fill="#1877F2" />
      <g transform="translate(14,14) scale(1.16667)">
        <path
          fill="#fff"
          d="M14.5 21V12.5H17l.4-3H14.5V7.4c0-.87.24-1.4 1.48-1.4H17.5V3.1C17.06 3.04 15.84 2.9 14.4 2.9c-2.86 0-4.82 1.74-4.82 4.94v2.66H7v3h2.58V21z"
        />
      </g>
    </svg>
  );
}

function XGlyph(props) {
  return (
    <svg viewBox="0 0 56 56" {...props}>
      <rect width="56" height="56" rx="12" fill="#000" />
      <g transform="translate(14,14) scale(1.16667)">
        <path
          fill="#fff"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </g>
    </svg>
  );
}

function SocialIconLink({ href, icon: Icon, label }) {
  if (!href) return null;
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title={label} className="flex h-7 w-7 items-center justify-center transition-transform hover:scale-110">
      <Icon className="h-full w-full" />
    </a>
  );
}

function WebsiteIconLink({ href, icon: Icon, label }) {
  if (!href) return null;
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      style={{ color: "#0EA5E9", backgroundColor: "#E0F2FE" }}
      className="flex h-7 w-7 items-center justify-center rounded-full border border-transparent transition-transform hover:scale-110"
    >
      <Icon size={13} />
    </a>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <p className="mt-0.5 text-[#374151]">{value || "Not added"}</p>
    </div>
  );
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "No date";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20"
      />
    </label>
  );
}

function EditContactPanel({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title="Edit Contact"
      subtitle="Update this contact's profile details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save Contact</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First Name" value={form.firstName} onChange={set("firstName")} />
        <Field label="Last Name" value={form.lastName} onChange={set("lastName")} />
        <Field label="Designation" value={form.designation} onChange={set("designation")} />
        <Field label="Status" value={form.status} onChange={set("status")} />
        <Field label="Email" value={form.email} onChange={set("email")} />
        <Field label="Phone" value={form.phone} onChange={set("phone")} />
        <Field label="WhatsApp" value={form.whatsapp} onChange={set("whatsapp")} />
        <Field label="Company" value={form.company} onChange={set("company")} />
      </div>
      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Social</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" value={form.linkedin} onChange={set("linkedin")} placeholder="linkedin.com/in/..." />
          <Field label="Website" value={form.website} onChange={set("website")} />
          <Field label="Instagram" value={form.instagram} onChange={set("instagram")} />
          <Field label="Facebook" value={form.facebook} onChange={set("facebook")} />
          <Field label="X (Twitter)" value={form.twitter} onChange={set("twitter")} />
        </div>
      </div>
    </SidePanel>
  );
}

export default function ContactDetail() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { records: contacts, loading, save, remove } = useCrmRecords("contacts");
  const { records: companies } = useCrmRecords("companies");
  const { showToast } = useToast();
  const contact = contacts.find((c) => String(c._id || c.id) === String(contactId));
  const [activeTab, setActiveTab] = useState("Overview");
  const [editing, setEditing] = useState(false);

  const companyMap = useMemo(() => new Map(companies.map((c) => [String(c.id || c._id), c])), [companies]);

  if (!contact && loading) {
    return (
      <div className="m-6 rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-gray-500">Loading contact…</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="m-6 rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-gray-500">Contact not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/contacts")}>Back to Contacts</Button>
      </div>
    );
  }

  const linkedCompany = companyMap.get(String(contact.companyId));
  const companyName = linkedCompany?.companyName || linkedCompany?.name || contact.company || "Not linked";
  const associated = contacts.filter((c) => String(c.companyId) === String(contact.companyId) && String(c._id || c.id) !== String(contactId)).slice(0, 5);

  async function handleSave(form) {
    await save(form);
    setEditing(false);
    showToast({ title: "Contact updated", message: `${contactFullName(form)} saved.` });
  }

  async function handleDelete() {
    await remove(contact);
    showToast({ title: "Contact deleted", message: `${contactFullName(contact)} removed.` });
    navigate("/admin/contacts");
  }

  return (
    <div className="flex min-h-full flex-col bg-[#f8fafc]">
      <div className="border-b border-[#e5e7eb] bg-white">
        <div className="px-6 py-6">
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800">
            <ChevronLeft size={15} /> Back to Contacts
          </button>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-[#fff8f6]">
                <Avatar name={contactFullName(contact)} size="lg" />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold text-[#111827]">{contactFullName(contact)}</h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6b7280]">
                  {contact.designation && <span>{contact.designation}</span>}
                  {(contact.whatsapp || contact.phone) && (
                    <span className="inline-flex items-center gap-1"><Phone size={12} /> {contact.whatsapp || contact.phone}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(contact.website || contact.linkedin || contact.instagram || contact.facebook || contact.twitter) && (
                <div className="flex items-center gap-1.5 pr-2">
                  <WebsiteIconLink href={contact.website} icon={Globe} label="Website" />
                  <SocialIconLink href={contact.linkedin} icon={LinkedInGlyph} label="LinkedIn" />
                  <SocialIconLink href={contact.instagram} icon={InstagramGlyph} label="Instagram" />
                  <SocialIconLink href={contact.facebook} icon={FacebookGlyph} label="Facebook" />
                  <SocialIconLink href={contact.twitter} icon={XGlyph} label="X" />
                </div>
              )}
              <ContactExportMenu contact={contact} companyName={companyName} />
              <Button variant="secondary" onClick={() => setEditing(true)}><Pencil size={13} /> Edit Contact</Button>
              <button onClick={handleDelete} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-[#f1f1f5] bg-[#fafafa] p-4 sm:grid-cols-3 lg:grid-cols-5">
            <InfoLine label="Company" value={companyName} />
            <InfoLine label="Designation" value={contact.designation} />
            <InfoLine label="Email" value={contact.email} />
            <InfoLine label="Status" value={contact.status || "Active"} />
            <InfoLine label="Contact Since" value={formatDate(contact.createdAt)} />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto px-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-[3px] px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab ? "border-[#C57E5B] text-[#C57E5B]" : "border-transparent text-[#1D1E22] hover:text-[#884c2d]"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-[#e5e7eb] bg-white p-5">
            {activeTab === "Notes" ? (
              <>
                <p className="mb-3 text-sm font-bold text-gray-700">Notes</p>
                <p className="text-sm text-gray-500">{contact.notes || "No notes added."}</p>
              </>
            ) : (
              <>
                <p className="mb-3 text-sm font-bold text-gray-700">Contact Details</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Detail icon={Mail} label="Email" value={contact.email} />
                  <Detail icon={Phone} label="Phone" value={contact.phone} />
                  <Detail icon={MessageCircle} label="WhatsApp" value={contact.whatsapp} />
                  <Detail icon={Building2} label="Company" value={companyName} />
                  <Detail label="Status" value={contact.status || "Active"} />
                  <Detail label="Designation" value={contact.designation} />
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
            <p className="mb-3 text-sm font-bold text-gray-700">Associated Contacts</p>
            {associated.length ? (
              <div className="space-y-3">
                {associated.map((item) => (
                  <button
                    key={item._id || item.id}
                    onClick={() => navigate(`/admin/contacts/${item._id || item.id}`)}
                    className="flex w-full items-center gap-2.5 text-left hover:bg-gray-50 rounded-lg -mx-1 px-1 py-0.5"
                  >
                    <Avatar name={contactFullName(item)} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{contactFullName(item)}</p>
                      <p className="text-xs text-gray-400">{item.email || "No email"}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No associated contacts yet.</p>}
          </div>
        </div>
      </div>

      {editing && <EditContactPanel contact={contact} onClose={() => setEditing(false)} onSave={handleSave} />}
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-gray-700">
        {Icon && <Icon size={13} className="text-gray-400" />}
        {value || "Not added"}
      </div>
    </div>
  );
}
