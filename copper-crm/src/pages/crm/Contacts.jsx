import { useMemo, useState } from "react";
import { Edit3, Mail, Phone, Plus, Save, Search, UserRound } from "lucide-react";
import { Button, Avatar } from "../../components/ui";
import { contacts as fallbackContacts } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

function Card({ children, className = "" }) {
  return <section className={`rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-100/60 ${className}`}>{children}</section>;
}

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
    </label>
  );
}

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const { records: contacts, save, loading } = useCrmRecords("contacts", fallbackContacts);
  const { showToast } = useToast();

  const filtered = useMemo(() => contacts.filter((contact) =>
    `${contact.name} ${contact.company} ${contact.email} ${contact.designation}`.toLowerCase().includes(search.toLowerCase())
  ), [contacts, search]);

  async function saveContact(contact) {
    try {
      const isNew = !contact._id;
      await save({ ...contact, id: contact.id || `C-${Date.now()}` });
      setEditing(null);
      showToast({
        title: isNew ? "Contact created" : "Contact updated",
        message: `${contact.name || "Contact"} saved successfully.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not save contact", message: error.message });
    }
  }

  return (
    <div className="p-5 xl:p-6">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Relationship management</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">{filtered.length} visible contacts - synced with CRM database</p>
        </div>
        <Button onClick={() => setEditing({ name: "", company: "", email: "", phone: "", designation: "", department: "", notes: "" })}><Plus size={14} /> Add Contact</Button>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {[
          ["Total contacts", contacts.length],
          ["Decision makers", contacts.filter((item) => /founder|ceo|head/i.test(item.designation || "")).length],
          ["Companies mapped", new Set(contacts.map((item) => item.company)).size],
        ].map(([label, value]) => (
          <Card key={label} className="p-4">
            <UserRound size={18} className="text-[#2563EB]" />
            <p className="mt-3 text-2xl font-bold text-gray-950">{value}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="grid gap-3 border-b border-gray-100 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
            <Search size={14} className="text-gray-400" />
            <input className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="Search contacts, company, designation" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <span className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-500">{loading ? "Loading..." : "Mongo ready"}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead>
              <tr className="bg-gray-50/80">
                {["Contact", "Company", "Email", "Phone", "Designation", "Next action", ""].map((header) => (
                  <th key={header} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact._id || contact.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={contact.name} />
                      <div>
                        <p className="text-sm font-bold text-gray-950">{contact.name}</p>
                        <p className="text-[11px] text-gray-400">{contact._id ? "Database contact" : "Sample contact"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-700">{contact.company}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500"><span className="inline-flex items-center gap-1.5"><Mail size={12} className="text-gray-300" />{contact.email}</span></td>
                  <td className="px-5 py-3 text-xs font-semibold text-gray-500"><span className="inline-flex items-center gap-1.5"><Phone size={12} className="text-gray-300" />{contact.phone}</span></td>
                  <td className="px-5 py-3 text-xs font-bold text-gray-500">{contact.designation}</td>
                  <td className="px-5 py-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">Follow up</span></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setEditing(contact)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#2563EB] hover:bg-blue-50"><Edit3 size={12} /> Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && <ContactModal contact={editing} onClose={() => setEditing(null)} onSave={saveContact} />}
    </div>
  );
}

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState(contact);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={contact._id || contact.id ? "Edit contact" : "Add contact"}
      subtitle="Update contact profile and communication details."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}><Save size={14} /> Save contact</Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={form.name} onChange={set("name")} />
        <Field label="Company" value={form.company} onChange={set("company")} />
        <Field label="Email" value={form.email} onChange={set("email")} />
        <Field label="Phone" value={form.phone} onChange={set("phone")} />
        <Field label="Designation" value={form.designation} onChange={set("designation")} />
        <Field label="Department" value={form.department} onChange={set("department")} />
        <label className="block sm:col-span-2">
          <span className="text-xs font-bold text-gray-600">Notes</span>
          <textarea value={form.notes || ""} onChange={(event) => set("notes")(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
        </label>
      </div>
    </SidePanel>
  );
}
