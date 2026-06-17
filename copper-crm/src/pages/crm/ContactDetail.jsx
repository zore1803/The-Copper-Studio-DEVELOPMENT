import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, ChevronLeft, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { Avatar, Button } from "../../components/ui";
import { contacts as fallbackContacts } from "../../data/mockData";
import { useCrmRecords } from "../../hooks/useCrmRecords";

export default function ContactDetail() {
  const { contactId } = useParams();
  const navigate = useNavigate();
  const { records: contacts } = useCrmRecords("contacts", fallbackContacts);
  const contact = contacts.find((c) => (c._id || c.id) === contactId) || fallbackContacts[0] || {};
  const [activeTab, setActiveTab] = useState("overview");

  const recentDeal = { amount: "₹29,98,520.00", label: "Recent Deal Created" };
  const associated = contacts.filter((c) => c.company === contact.company && (c._id || c.id) !== contactId).slice(0, 2);

  return (
    <div className="p-5 xl:p-6 bg-[#f9fafb] min-h-full">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900">
            <ChevronLeft size={16} /> {contact.name || "Contact Name"}
          </button>
          {contact.status && (
            <span className="ml-2 text-xs text-gray-400">» {contact.status}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Pencil size={13} /> Edit
          </Button>
          <button className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
            <Trash2 size={13} /> Delete Contact
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-3 gap-6 border-b border-gray-100 p-5">
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={contact.name} size="lg" />
              <p className="text-lg font-bold text-gray-900">{contact.name || "Contact Full Name Here"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 mb-3">
              <p className="text-xs text-gray-400 mb-1">{recentDeal.label}</p>
              <p className="text-xl font-bold text-gray-900">{recentDeal.amount}</p>
              <button className="mt-1 text-xs font-semibold text-blue-500 hover:underline">View</button>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600">
              <Plus size={13} /> Create New Deal
            </button>
          </div>

          <div className="col-span-1">
            <p className="mb-3 text-sm font-bold text-gray-700">Contact Details</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <p className="text-[11px] text-gray-400">Email</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><Mail size={13} className="text-gray-400" />{contact.email || "email@gmail.com"}</div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Phone</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><Phone size={13} className="text-gray-400" />{contact.phone || "+91 123456789"}</div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Company</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><Building2 size={13} className="text-gray-400" />{contact.company || "Company Name"}</div>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Status</p>
                <p className="text-sm text-gray-700">{contact.status || "New Lead"}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Location</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-700"><MapPin size={13} className="text-gray-400" />{contact.location || "Location Goes Here"}</div>
              </div>
            </div>
          </div>

          <div className="col-span-1">
            <p className="mb-3 text-sm font-bold text-gray-700">Associated Contacts</p>
            <div className="space-y-3">
              {associated.length > 0 ? associated.map((ac) => (
                <div key={ac._id || ac.id} className="flex items-center gap-2.5">
                  <Avatar name={ac.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ac.name}</p>
                    <p className="text-xs text-gray-400">Contact created on {new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })}</p>
                  </div>
                </div>
              )) : (
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Associated Contact Name</p>
                    <p className="text-xs text-gray-400">Contact created on June 06th, 2026</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex gap-4 border-b border-gray-100 mb-5">
            {["overview", "deals", "notes"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-2 text-sm font-semibold capitalize transition-colors ${activeTab === t ? "border-b-2 border-[#2563EB] text-[#2563EB]" : "text-gray-400 hover:text-gray-600"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {activeTab === "overview" && (
            <div className="text-sm text-gray-400 text-center py-10">Activity timeline will appear here.</div>
          )}
          {activeTab === "deals" && (
            <div className="text-sm text-gray-400 text-center py-10">Deal history will appear here.</div>
          )}
          {activeTab === "notes" && (
            <div className="text-sm text-gray-400 text-center py-10">Notes will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
