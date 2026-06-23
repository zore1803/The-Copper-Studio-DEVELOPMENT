import { useMemo, useState } from "react";
import { Archive, Copy, Mail, MessageCircle, Plus, Save, Search, Settings2, X } from "lucide-react";
import { Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const EMAIL_CATEGORIES = [
  "Welcome", "Consultation Booked", "Proposal Sent", "Proposal Reminder",
  "Coupon Issued", "Payment Success", "Invoice Generated", "Project Started",
  "Project Update", "Testing Started", "Project Delivered", "Support Follow-up",
];

const WHATSAPP_CATEGORIES = [
  "OTP", "Proposal Sent", "Coupon Shared", "Payment Received", "Invoice Generated",
  "Project Started", "Milestone Completed", "Project Delivered", "Reminder",
];

const VARIABLES = [
  "client_name", "company_name", "proposal_id", "invoice_id",
  "coupon_code", "project_name", "project_status", "payment_amount",
];

function KpiCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
          <Icon size={16} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-[#111827]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d8c2b9] bg-white p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
        <MessageCircle size={20} />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-[#6b7280]">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function TemplateModal({ type, categories, template, onClose, onSave }) {
  const [form, setForm] = useState(template);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <SidePanel
      title={template._id || template.id ? "Edit Template" : `New ${type} Template`}
      subtitle="Use variables like {{client_name}} for dynamic content."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save Template</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Template name</span>
          <input value={form.name || ""} onChange={(e) => set("name")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Category</span>
          <select value={form.category || ""} onChange={(e) => set("category")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d]">
            <option value="">Select...</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        {type === "email" && (
          <label className="block">
            <span className="text-xs font-semibold text-[#374151]">Subject</span>
            <input value={form.subject || ""} onChange={(e) => set("subject")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Message body</span>
          <textarea value={form.body || ""} onChange={(e) => set("body")(e.target.value)} rows={6} placeholder="Hello {{client_name}}, ..." className="mt-1.5 w-full resize-none rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d] focus:ring-2 focus:ring-[#884c2d]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#374151]">Status</span>
          <select value={form.status || "Draft"} onChange={(e) => set("status")(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm outline-none focus:border-[#884c2d]">
            {["Draft", "Active", "Archived"].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>
    </SidePanel>
  );
}

function VariablesModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#111827]">Template Variables</p>
          <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]"><X size={16} /></button>
        </div>
        <p className="mt-1 text-xs text-[#6b7280]">Use these placeholders inside any template body or subject.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {VARIABLES.map((variable) => (
            <span key={variable} className="rounded-lg bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[#374151]">{`{{${variable}}}`}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplateList({ type, records, categories, onCreate, onEdit, onCopy, onArchive }) {
  const [query, setQuery] = useState("");
  const filtered = records.filter((record) =>
    `${record.name || ""} ${record.category || ""} ${record.subject || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <aside className="rounded-xl border border-[#e5e7eb] bg-white p-4">
        <p className="text-sm font-bold text-[#111827]">Categories</p>
        <div className="mt-3 space-y-1">
          {categories.map((category) => (
            <button key={category} onClick={() => setQuery(category)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-[#374151] hover:bg-[#fafafa]">
              <span>{category}</span>
              <span className="text-xs text-[#9ca3af]">{records.filter((r) => r.category === category).length}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-xl border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#f3f4f6] px-4 py-3">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3">
            <Search size={14} className="text-[#9ca3af]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${type} templates`} className="w-60 bg-transparent text-sm outline-none" />
          </div>
          <Button onClick={onCreate}><Plus size={14} /> New Template</Button>
        </div>
        {filtered.length ? (
          <div className="divide-y divide-[#f3f4f6]">
            {filtered.map((template) => (
              <div key={template._id || template.id || template.name} className="p-4 hover:bg-[#fafafa] cursor-pointer" onClick={() => onEdit(template)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">{template.name || "Untitled template"}</p>
                    <p className="mt-1 text-xs text-[#6b7280]">{template.category || "No category"} - {template.status || "Draft"}</p>
                    {template.subject && <p className="mt-2 text-sm text-[#374151]">{template.subject}</p>}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onCopy(template)} title="Duplicate" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><Copy size={13} /></button>
                    <button onClick={() => onArchive(template)} title={template.status === "Archived" ? "Unarchive" : "Archive"} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"><Archive size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={`No ${type} templates yet.`} text="Create templates with variables so proposal, coupon, payment, invoice, and project updates can be automated." action={<Button onClick={onCreate}><Plus size={14} /> Create Template</Button>} />
        )}
      </section>

      <aside className="rounded-xl border border-[#e5e7eb] bg-white p-4">
        <p className="text-sm font-bold text-[#111827]">Variables</p>
        <p className="mt-1 text-xs text-[#6b7280]">Use these in templates for dynamic client communication.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {VARIABLES.map((variable) => (
            <span key={variable} className="rounded-lg bg-[#f3f4f6] px-2 py-1 font-mono text-xs text-[#374151]">{`{{${variable}}}`}</span>
          ))}
        </div>
        <div className="mt-5 rounded-xl bg-[#fff8f6] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#884c2d]">Preview Pattern</p>
          <p className="mt-2 text-sm text-[#374151]">Hello {"{{client_name}}"}, your {"{{proposal_id}}"} is ready for review.</p>
        </div>
      </aside>
    </div>
  );
}

export default function CommunicationCenter({ mode = "email" }) {
  const { records: emailTemplates, save: saveEmailTemplate } = useCrmRecords("emailTemplates");
  const { records: whatsappTemplates, save: saveWhatsappTemplate } = useCrmRecords("whatsappTemplates");
  const { showToast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [variablesOpen, setVariablesOpen] = useState(false);

  const stats = useMemo(() => ({
    emailTemplates: emailTemplates.length,
    activeEmail: emailTemplates.filter((template) => template.status === "Active").length,
    whatsappTemplates: whatsappTemplates.length,
    activeWhatsapp: whatsappTemplates.filter((template) => template.status === "Active").length,
  }), [emailTemplates, whatsappTemplates]);

  const page = {
    email: { title: "Email Templates", subtitle: "Reusable email templates for proposals, payments, invoices, project updates, and support.", icon: Mail },
    whatsapp: { title: "WhatsApp Templates", subtitle: "Quick customer communication with Meta-ready template states and variables.", icon: MessageCircle },
  }[mode] || { title: "Email Templates", subtitle: "Reusable client communication templates.", icon: Mail };

  const PageIcon = page.icon;
  const saveTemplate = mode === "whatsapp" ? saveWhatsappTemplate : saveEmailTemplate;

  async function handleSaveTemplate(form) {
    await saveTemplate({ ...form, id: form.id || `${mode}-template-${Date.now()}` });
    setEditingTemplate(null);
    showToast({ title: "Template saved", message: `${form.name || "Template"} saved.` });
  }

  async function handleCopyTemplate(template) {
    const clone = { ...template, name: `${template.name || "Template"} (Copy)`, id: `${mode}-template-${Date.now()}` };
    delete clone._id;
    await saveTemplate(clone);
    showToast({ title: "Template duplicated", message: `Created a copy of ${template.name || "the template"}.` });
  }

  async function handleArchiveTemplate(template) {
    const nextStatus = template.status === "Archived" ? "Draft" : "Archived";
    await saveTemplate({ ...template, status: nextStatus });
    showToast({ title: nextStatus === "Archived" ? "Template archived" : "Template restored", message: `${template.name || "Template"} is now ${nextStatus}.` });
  }

  return (
    <div className="min-h-full bg-[#f5f6fa] p-6">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Client Communication Center</p>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff1ec] text-[#884c2d]">
              <PageIcon size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">{page.title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-[#6b7280]">{page.subtitle}</p>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setVariablesOpen(true)}><Settings2 size={14} /> Variables</Button>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Email Templates" value={stats.emailTemplates} icon={Mail} />
        <KpiCard label="Active Email" value={stats.activeEmail} icon={Mail} />
        <KpiCard label="WhatsApp Templates" value={stats.whatsappTemplates} icon={MessageCircle} />
        <KpiCard label="Active WhatsApp" value={stats.activeWhatsapp} icon={MessageCircle} />
      </div>

      {mode === "whatsapp" ? (
        <TemplateList
          type="WhatsApp"
          records={whatsappTemplates}
          categories={WHATSAPP_CATEGORIES}
          onCreate={() => setEditingTemplate({ name: "", category: "", body: "", status: "Draft" })}
          onEdit={setEditingTemplate}
          onCopy={handleCopyTemplate}
          onArchive={handleArchiveTemplate}
        />
      ) : (
        <TemplateList
          type="email"
          records={emailTemplates}
          categories={EMAIL_CATEGORIES}
          onCreate={() => setEditingTemplate({ name: "", category: "", subject: "", body: "", status: "Draft" })}
          onEdit={setEditingTemplate}
          onCopy={handleCopyTemplate}
          onArchive={handleArchiveTemplate}
        />
      )}

      {editingTemplate && (
        <TemplateModal
          type={mode === "whatsapp" ? "WhatsApp" : "email"}
          categories={mode === "whatsapp" ? WHATSAPP_CATEGORIES : EMAIL_CATEGORIES}
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={handleSaveTemplate}
        />
      )}
      {variablesOpen && <VariablesModal onClose={() => setVariablesOpen(false)} />}
    </div>
  );
}
