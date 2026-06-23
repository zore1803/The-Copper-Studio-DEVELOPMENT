import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Download, Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "./useToast";
import { contactFullName } from "../lib/contacts";

function useClickOutside(refs, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    function onDocMouseDown(event) {
      const list = Array.isArray(refs) ? refs : [refs];
      if (list.some((ref) => ref.current && ref.current.contains(event.target))) return;
      onOutside();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [active, onOutside, refs]);
}

function normalizedUrl(value) {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function buildContactText(contact, companyName) {
  return [
    contactFullName(contact),
    contact.designation,
    companyName && `Company: ${companyName}`,
    contact.email && `Email: ${contact.email}`,
    (contact.whatsapp || contact.phone) && `Phone: ${contact.whatsapp || contact.phone}`,
    contact.linkedin && `LinkedIn: ${normalizedUrl(contact.linkedin)}`,
  ].filter(Boolean).join("\n");
}

function vCardFor(contact, companyName) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${contactFullName(contact)}`,
    contact.designation && `TITLE:${contact.designation}`,
    companyName && `ORG:${companyName}`,
    contact.email && `EMAIL:${contact.email}`,
    (contact.whatsapp || contact.phone) && `TEL:${contact.whatsapp || contact.phone}`,
    contact.linkedin && `URL:${normalizedUrl(contact.linkedin)}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

// Reused on the Contacts table (per-row) and on the Contact detail header —
// a single export menu so both surfaces share the same share/copy/download logic.
export default function ContactExportMenu({ contact, companyName, className = "" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const { showToast } = useToast();

  useClickOutside([btnRef, menuRef], () => setOpen(false), open);

  function toggle(event) {
    event.stopPropagation();
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 224) });
    }
    setOpen((value) => !value);
  }

  function close() {
    setOpen(false);
  }

  async function copyDetails(event) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(buildContactText(contact, companyName));
      showToast({ title: "Copied", message: `${contactFullName(contact)}'s details copied to clipboard.` });
    } catch {
      showToast({ type: "error", title: "Couldn't copy", message: "Your browser blocked clipboard access." });
    }
    close();
  }

  function shareWhatsApp(event) {
    event.stopPropagation();
    const text = encodeURIComponent(buildContactText(contact, companyName));
    const number = String(contact.whatsapp || contact.phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/${number}?text=${text}`, "_blank", "noopener,noreferrer");
    close();
  }

  function shareEmail(event) {
    event.stopPropagation();
    const subject = encodeURIComponent(`Contact: ${contactFullName(contact)}`);
    const body = encodeURIComponent(buildContactText(contact, companyName));
    window.location.href = `mailto:${contact.email || ""}?subject=${subject}&body=${body}`;
    close();
  }

  function openLinkedIn(event) {
    event.stopPropagation();
    if (!contact.linkedin) {
      showToast({ type: "error", title: "No LinkedIn added", message: "Add a LinkedIn URL to this contact first." });
      close();
      return;
    }
    window.open(normalizedUrl(contact.linkedin), "_blank", "noopener,noreferrer");
    close();
  }

  function downloadVCard(event) {
    event.stopPropagation();
    const blob = new Blob([vCardFor(contact, companyName)], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contactFullName(contact).replace(/[^a-z0-9]+/gi, "-")}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
    close();
  }

  return (
    <div className={`relative inline-block ${className}`} onClick={(event) => event.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Export contact"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#374151] transition-colors"
      >
        <Share2 size={14} />
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
          className="z-50 w-56 rounded-xl border border-[#e5e7eb] bg-white shadow-lg py-1.5"
        >
          <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9ca3af]">Export to</p>
          <button onClick={shareWhatsApp} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <MessageCircle size={14} className="text-emerald-600" /> Share via WhatsApp
          </button>
          <button onClick={openLinkedIn} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Link2 size={14} className="text-[#0a66c2]" /> Open LinkedIn profile
          </button>
          <button onClick={shareEmail} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Mail size={14} className="text-[#884c2d]" /> Share via Email
          </button>
          <button onClick={downloadVCard} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Download size={14} /> Download as vCard
          </button>
          <div className="my-1 border-t border-[#f3f4f6]" />
          <button onClick={copyDetails} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#374151] hover:bg-[#f9fafb]">
            <Copy size={14} /> Copy details
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
