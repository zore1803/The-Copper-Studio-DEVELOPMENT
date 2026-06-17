import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, ChevronLeft, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";

export default function ContactDetail() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { records: contacts } = useCrmRecords("contacts");
  const { records: deals } = useCrmRecords("deals");
  const contact = contacts.find((c) => String(c._id || c.id) === String(contactId));
  const [activeTab, setActiveTab] = useState("overview");

  if (!contact) {
    return (
      <div className="m-6 rounded-xl border border-gray-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-gray-500">Contact not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/contacts")}>Back to Contacts</Button>
      </div>
    );
  }

  const contactDeals = deals.filter((deal) =>
    String(deal.contactId) === String(contactId) ||
    deal.contact === contact.name ||
    deal.owner === contact.name
  );
  const associated = contacts.filter((c) => c.company === contact.company && String(c._id || c.id) !== String(contactId)).slice(0, 3);

  return (
    <div className="min-h-full bg-[#f9fafb] p-5 xl:p-6">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900">
          <ChevronLeft size={16} /> {contact.name || "Unnamed contact"}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm"><Pencil size={13} /> Edit</Button>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
            <Trash2 size={13} /> Delete Contact
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 border-b border-gray-100 p-5 xl:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={contact.name} size="lg" />
              <div>
                <p className="text-lg font-bold text-gray-900">{contact.name || "Unnamed contact"}</p>
                <p className="text-sm text-gray-500">{contact.designation || "No designation"}</p>
              </div>
            </div>
            <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <p className="mb-1 text-xs text-gray-400">Linked deals</p>
              <p className="text-xl font-bold text-gray-900">{contactDeals.length}</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600">
              <Plus size={13} /> Create New Deal
            </button>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-gray-700">Contact Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Detail icon={Mail} label="Email" value={contact.email} />
              <Detail icon={Phone} label="Phone" value={contact.phone} />
              <Detail icon={Building2} label="Company" value={contact.company} />
              <Detail label="Status" value={contact.status} />
              <Detail icon={MapPin} label="Location" value={contact.location} />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-gray-700">Associated Contacts</p>
            {associated.length ? (
              <div className="space-y-3">
                {associated.map((item) => (
                  <div key={item._id || item.id} className="flex items-center gap-2.5">
                    <Avatar name={item.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name || "Unnamed contact"}</p>
                      <p className="text-xs text-gray-400">{item.email || "No email"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No associated contacts yet.</p>}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 flex gap-4 border-b border-gray-100">
            {["overview", "deals", "notes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-gray-400 hover:text-gray-600"}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="py-10 text-center text-sm text-gray-400">
            {activeTab === "deals" ? `${contactDeals.length} linked deals.` : `${activeTab[0].toUpperCase()}${activeTab.slice(1)} will appear here.`}
          </div>
        </div>
      </div>
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
