import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, MoreHorizontal, Mail, Phone, Zap, ArrowRight, Save } from "lucide-react";
import { Button, Avatar } from "../../components/ui";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";
import SidePanel from "../../components/SidePanel";

const stageConfig = {
  "New Lead":      { dot: "bg-blue-500",    accent: "border-t-blue-400",   pill: "bg-blue-50 text-blue-700",    total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
  "Contacted":     { dot: "bg-violet-500",  accent: "border-t-violet-400", pill: "bg-violet-50 text-violet-700",total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
  "Qualified":     { dot: "bg-indigo-500",  accent: "border-t-indigo-400", pill: "bg-indigo-50 text-indigo-700",total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
  "Proposal Sent": { dot: "bg-amber-500",   accent: "border-t-amber-400",  pill: "bg-amber-50 text-amber-700",  total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
  "Negotiation":   { dot: "bg-purple-500",  accent: "border-t-purple-400", pill: "bg-purple-50 text-purple-700",total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
  "Won":           { dot: "bg-emerald-500", accent: "border-t-emerald-400",pill: "bg-emerald-50 text-emerald-700",total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
  "Lost":          { dot: "bg-red-400",     accent: "border-t-red-300",    pill: "bg-red-50 text-red-600",      total: (cards) => cards.reduce((s, c) => s + amountValue(c.value), 0) },
};

const LEAD_STAGES = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];

const sourceColor = {
  Instagram:      "bg-pink-50 text-pink-600",
  Referral:       "bg-emerald-50 text-emerald-700",
  LinkedIn:       "bg-blue-50 text-blue-700",
  "Google Ads":   "bg-amber-50 text-amber-700",
  WhatsApp:       "bg-green-50 text-green-700",
  "Cold Outreach":"bg-gray-100 text-gray-500",
};

function fmt(n) {
  if (n >= 100000) return `Rs ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs ${(n / 1000).toFixed(0)}k`;
  return `Rs ${n}`;
}

function amountValue(value) {
  return Number(String(value || "").replace(/[^\d.]/g, "")) || 0;
}

export default function Leads() {
  const [columns, setColumns] = useState(() => Object.fromEntries(LEAD_STAGES.map((stage) => [stage, []])));
  const [dragging, setDragging] = useState(false);
  const [leadEditor, setLeadEditor] = useState(null);
  const { showToast } = useToast();
  const { records: dbLeads, save: saveDbLead } = useCrmRecords("leads");

  useEffect(() => {
    const nextColumns = Object.fromEntries(LEAD_STAGES.map((key) => [key, []]));
    dbLeads.forEach((lead) => {
      const stage = nextColumns[lead.stage] ? lead.stage : "New Lead";
      nextColumns[stage].push(lead);
    });
    queueMicrotask(() => setColumns(nextColumns));
  }, [dbLeads]);

  function onDragStart() { setDragging(true); }

  async function onDragEnd({ source, destination }) {
    setDragging(false);
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const src = [...columns[source.droppableId]];
    const dst = source.droppableId === destination.droppableId ? src : [...columns[destination.droppableId]];
    const [item] = src.splice(source.index, 1);
    dst.splice(destination.index, 0, item);
    setColumns({ ...columns, [source.droppableId]: src, [destination.droppableId]: dst });
    if (source.droppableId !== destination.droppableId) {
      await saveDbLead({ ...item, stage: destination.droppableId });
    }
  }

  async function saveLead(lead, stage) {
    try {
      const isNew = !lead._id;
      const saved = await saveDbLead({
        ...lead,
        id: lead.id || `L-${Date.now()}`,
        stage
      });
      setColumns((current) => {
        const cleaned = Object.fromEntries(
          Object.entries(current).map(([key, cards]) => [
            key,
            cards.filter((card) => card.id !== saved.id && card._id !== saved._id),
          ])
        );
        return { ...cleaned, [stage]: [saved, ...(cleaned[stage] || [])] };
      });
      setLeadEditor(null);
      showToast({
        title: isNew ? "Lead created" : "Lead updated",
        message: `${lead.name || "Lead"} saved in ${stage}.`,
      });
    } catch (error) {
      showToast({ type: "error", title: "Could not save lead", message: error.message });
    }
  }

  const totalPipeline = Object.values(columns).flat()
    .reduce((s, c) => s + amountValue(c.value), 0);

  return (
    <div className="p-6 flex flex-col" style={{ minHeight: "calc(100vh - 56px)" }}>
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Lead Pipeline</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {Object.values(columns).flat().length} leads · Pipeline value{" "}
            <span className="font-semibold text-gray-700">{fmt(totalPipeline)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <Zap size={11} className="text-amber-400" />
            Drag cards to move stages
          </div>
          <Button onClick={() => setLeadEditor({ stage: "New Lead", lead: { name: "", company: "", value: "", service: "", source: "Website", lastActivity: "Created now", email: "", phone: "" } })}><Plus size={13} strokeWidth={2.5} /> Add Lead</Button>
        </div>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2 flex-1" style={{ minHeight: 0 }}>
          {Object.entries(columns).map(([stage, cards]) => {
            const cfg = stageConfig[stage];
            const stageTotal = cfg.total(cards);
            return (
              <div key={stage} className="flex-shrink-0 w-[220px] flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="text-xs font-semibold text-gray-700 truncate">{stage}</span>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md flex-shrink-0">{cards.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {stageTotal > 0 && (
                      <span className="text-[10px] font-bold text-gray-500">{fmt(stageTotal)}</span>
                    )}
                    <button onClick={() => setLeadEditor({ stage, lead: { name: "", company: "", value: "", service: "", source: "Website", lastActivity: "Created now", email: "", phone: "" } })} className="text-gray-300 hover:text-gray-500 transition-colors">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{ transition: "background-color 0.2s ease, border-color 0.2s ease" }}
                      className={`rounded-2xl p-2 flex-1 overflow-y-auto min-h-[80px] ${
                        snapshot.isDraggingOver
                          ? "bg-blue-50/70 border-2 border-dashed border-blue-300"
                          : dragging
                          ? "bg-gray-50/80 border-2 border-dashed border-gray-200"
                          : "bg-gray-50/60 border-2 border-transparent"
                      }`}
                    >
                      <div className="space-y-2">
                        {cards.map((card, index) => {
                          const dragId = String(card.id || card._id || `${stage}-${index}`);
                          return (
                          <Draggable key={dragId} draggableId={dragId} index={index}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={`bg-white rounded-xl border-t-2 ${cfg.accent} border border-gray-100 cursor-grab active:cursor-grabbing select-none group/card ${
                                  snap.isDragging
                                    ? "shadow-2xl shadow-black/10 scale-[1.03] rotate-[0.8deg] opacity-95 border-gray-200"
                                    : "hover:shadow-md hover:-translate-y-0.5"
                                }`}
                                style={{
                                  ...prov.draggableProps.style,
                                  transition: snap.isDropAnimating
                                    ? "transform 0.18s cubic-bezier(0.2,1,0.1,1)"
                                    : snap.isDragging
                                      ? undefined
                                      : "box-shadow 0.15s ease, transform 0.15s ease",
                                }}
                              >
                                <div className="p-3">
                                  {/* Name + menu */}
                                  <div className="flex items-start justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Avatar name={card.name} size="sm" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 leading-none truncate">{card.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">{card.company}</p>
                                      </div>
                                    </div>
                                    <button onClick={() => setLeadEditor({ stage, lead: card })} className="opacity-0 group-hover/card:opacity-100 text-gray-300 hover:text-gray-500 flex-shrink-0 transition-opacity">
                                      <MoreHorizontal size={13} />
                                    </button>
                                  </div>

                                  {/* Service */}
                                  <p className="text-[10px] text-gray-500 mb-2 leading-snug">{card.service}</p>

                                  {/* Source pill */}
                                  <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-2.5 ${sourceColor[card.source] || "bg-gray-100 text-gray-500"}`}>
                                    {card.source}
                                  </span>

                                  {/* Divider */}
                                  <div className="border-t border-gray-50 pt-2 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-900">{card.value || "Value not set"}</span>
                                    <div className="flex items-center gap-1">
                                      <button className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all">
                                        <Mail size={10} />
                                      </button>
                                      <button className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                                        <Phone size={10} />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Last activity */}
                                  <p className="text-[9px] text-gray-400 mt-1.5 truncate">{card.lastActivity}</p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        )})}
                      </div>
                      {provided.placeholder}

                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-300">
                          <ArrowRight size={16} className="mb-1 rotate-90" />
                          <p className="text-[10px]">Drop here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      {leadEditor && (
        <LeadModal
          stages={Object.keys(columns)}
          initialStage={leadEditor.stage}
          lead={leadEditor.lead}
          onClose={() => setLeadEditor(null)}
          onSave={saveLead}
        />
      )}
    </div>
  );
}

function LeadModal({ stages, initialStage, lead, onClose, onSave }) {
  const [stage, setStage] = useState(initialStage);
  const [form, setForm] = useState(lead);
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <SidePanel
      title={lead._id || lead.id ? "Edit lead" : "Add lead"}
      subtitle="Capture lead details, source, value, and pipeline stage."
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form, stage)}><Save size={14} /> Save lead</Button>
        </div>
      }
    >
        <div className="grid gap-4 sm:grid-cols-2">
          <LeadField label="Name" value={form.name} onChange={set("name")} />
          <LeadField label="Company" value={form.company} onChange={set("company")} />
          <LeadField label="Email" value={form.email} onChange={set("email")} />
          <LeadField label="Phone" value={form.phone} onChange={set("phone")} />
          <LeadField label="Service" value={form.service} onChange={set("service")} />
          <LeadField label="Value" value={form.value} onChange={set("value")} />
          <LeadField label="Source" value={form.source} onChange={set("source")} />
          <label className="block">
            <span className="text-xs font-bold text-gray-600">Stage</span>
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50">
              {stages.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
    </SidePanel>
  );
}

function LeadField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-600">{label}</span>
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
    </label>
  );
}
