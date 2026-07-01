import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";

const CATEGORIES = ["CopperBrand", "CopperWeb", "CopperFlow"];

const FALLBACK_PACKAGES = [
  {
    id: "copperbrand-essential", category: "CopperBrand", name: "Essential Package Plan",
    label: "Brand foundation", price: 24999, duration: "15 days delivery",
    includes: ["Logo design (3 concepts)", "Brand colour palette", "Typography selection", "Business card design", "Brand guidelines PDF"],
  },
  {
    id: "copperbrand-advance", category: "CopperBrand", name: "Advance Package Plan",
    label: "Most popular", price: 49999, duration: "25 days delivery",
    includes: ["Everything in Essential", "Extended logo suite", "Social media kit", "Letterhead & stationery", "Brand story document", "2 revision rounds"],
  },
  {
    id: "copperbrand-ultimate", category: "CopperBrand", name: "Ultimate Package Plan",
    label: "Full brand identity", price: 89999, duration: "40 days delivery",
    includes: ["Everything in Advance", "Brand strategy workshop", "Packaging design", "Brand photography direction", "Pitch deck template", "Unlimited revisions"],
  },
  {
    id: "copperweb-essential", category: "CopperWeb", name: "Essential Package Plan",
    label: "Web presence starter", price: 29999, duration: "20 days delivery",
    includes: ["5-page website", "Mobile responsive design", "Contact form integration", "Basic SEO setup", "1 month post-launch support"],
  },
  {
    id: "copperweb-advance", category: "CopperWeb", name: "Advance Package Plan",
    label: "Most popular", price: 59999, duration: "35 days delivery",
    includes: ["Everything in Essential", "Up to 15 pages", "CMS integration", "Blog setup", "Google Analytics & Search Console", "Performance optimisation"],
  },
  {
    id: "copperweb-ultimate", category: "CopperWeb", name: "Ultimate Package Plan",
    label: "Full web platform", price: 119999, duration: "60 days delivery",
    includes: ["Everything in Advance", "Custom web application", "E-commerce / payment gateway", "API integrations", "3 months dedicated support", "Hosting & domain setup"],
  },
  {
    id: "copperflow-essential", category: "CopperFlow", name: "Essential Package Plan",
    label: "Automate the basics", price: 19999, duration: "10 days delivery",
    includes: ["Lead capture automation", "Email welcome sequence", "Basic CRM setup", "Inquiry form integration", "30-day support"],
  },
  {
    id: "copperflow-advance", category: "CopperFlow", name: "Advance Package Plan",
    label: "Most popular", price: 44999, duration: "20 days delivery",
    includes: ["Everything in Essential", "Multi-step sales funnel", "WhatsApp + email automation", "Proposal & invoice workflows", "Payment reminders", "60-day support"],
  },
  {
    id: "copperflow-ultimate", category: "CopperFlow", name: "Ultimate Package Plan",
    label: "End-to-end automation", price: 79999, duration: "35 days delivery",
    includes: ["Everything in Advance", "Custom client portal", "Project milestone notifications", "Advanced analytics dashboard", "Team collaboration setup", "90-day dedicated support"],
  },
];

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function backendUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || "";
  if (!base) return path;
  return `${base.replace(/\/api\/?$/, "").replace(/\/$/, "")}${path}`;
}

export default function PublicPackages() {
  const [packages, setPackages] = useState(FALLBACK_PACKAGES);
  const [activeCategory, setActiveCategory] = useState("CopperBrand");

  useEffect(() => {
    apiGet("/api/packages")
      .then((data) => {
        if (Array.isArray(data) && data.length && data.some((p) => p.category)) {
          setPackages(data);
        }
      })
      .catch(() => {});
  }, []);

  const visible = packages.filter((p) => p.category === activeCategory);
  const featuredId =
    visible.find((p) => /most|popular|advance/i.test(`${p.label} ${p.name}`))?.id ||
    visible[1]?.id;

  return (
    <div style={{ minHeight: "100vh", background: "#F0EDE4", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1A1A1A" }}>

      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", padding: "32px 0 28px" }}>
        <a href="/" aria-label="The Copper Studio">
          <img
            src="/copper-crm/public/copper-studio-wordmark.png"
            alt="The Copper Studio"
            style={{ height: 64, width: "auto", display: "block" }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </a>
      </div>

      <div style={{ width: "min(1100px, calc(100% - 40px))", margin: "0 auto", paddingBottom: 80 }}>

        {/* Hero card */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 300px",
          gap: 32,
          alignItems: "center",
          padding: "40px 36px",
          border: "1px solid #FFFFFF",
          borderRadius: 14,
          background: "#ffffff",
          boxShadow: "0 14px 34px rgba(0,0,0,0.04)",
          marginBottom: 40,
        }}>
          <div>
            <span style={{ display: "inline-block", marginBottom: 12, color: "#5A1A14", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Step 1 — Select a package
            </span>
            <h1 style={{ margin: "0 0 12px", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "clamp(1.9rem,3.4vw,2.5rem)", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1A1A1A" }}>
              Choose a package to get started.
            </h1>
            <p style={{ margin: 0, maxWidth: 500, color: "#6B7280", fontSize: "0.95rem", lineHeight: 1.55 }}>
              Pick a package, verify your details, pay securely via Razorpay, and receive your invoice by email.
            </p>
          </div>
          <div style={{ padding: 20, border: "1px solid #E5E7EB", borderRadius: 12, background: "#FFFFFF" }}>
            <p style={{ margin: "0 0 12px", color: "#6B7280", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Included after payment
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 11 }}>
              {[
                { icon: "✓", text: "Account confirmation & portal access" },
                { icon: "✓", text: "GST invoice (PDF)" },
                { icon: "✓", text: "Welcome & onboarding steps" },
              ].map((item) => (
                <li key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, color: "#1A1A1A", fontSize: "0.86rem" }}>
                  <span style={{ color: "#5A1A14", fontWeight: 700 }}>{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section head */}
        <div style={{ marginBottom: 22 }}>
          <h2 style={{ margin: "0 0 5px", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.02em", color: "#1A1A1A" }}>
            Our packages
          </h2>
          <p style={{ margin: 0, color: "#6B7280", fontSize: "0.9rem" }}>
            Select a service category, choose your plan, and proceed to checkout.
          </p>
        </div>

        {/* Category switcher */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: 5, gap: 4, boxShadow: "0 2px 10px rgba(136,76,45,0.07)" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "10px 26px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "background 0.18s, color 0.18s, box-shadow 0.18s",
                  background: activeCategory === cat ? "#5A1A14" : "transparent",
                  color: activeCategory === cat ? "#fff" : "#6B7280",
                  boxShadow: activeCategory === cat ? "0 2px 8px rgba(136,76,45,0.22)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Package cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 22 }}>
          {visible.map((pkg) => {
            const featured = pkg.id === featuredId;
            const checkoutHref = backendUrl(`/checkout?package=${encodeURIComponent(pkg.id)}`);
            return (
              <div
                key={pkg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: "28px 26px",
                  border: featured ? "1px solid #5A1A14" : "1px solid #E5E7EB",
                  borderRadius: 14,
                  background: "#ffffff",
                  boxShadow: featured
                    ? "0 0 0 1px #5A1A14 inset, 0 18px 40px rgba(150,77,10,0.12)"
                    : "0 14px 34px rgba(0,0,0,0.04)",
                  transition: "border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => { if (!featured) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "#6B7280"; } }}
                onMouseLeave={(e) => { if (!featured) { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#E5E7EB"; } }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <p style={{ margin: "0 0 5px", color: "#6B7280", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {activeCategory}
                    </p>
                    <h3 style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "1.25rem", fontWeight: 500, letterSpacing: "-0.01em", color: "#1A1A1A" }}>
                      {pkg.name}
                    </h3>
                  </div>
                  {featured && (
                    <span style={{ flexShrink: 0, background: "#FFFFFF", color: "#5A1A14", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 999 }}>
                      Popular
                    </span>
                  )}
                </div>

                {/* Price */}
                <div>
                  <p style={{ margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "2.1rem", fontWeight: 500, color: "#1A1A1A" }}>
                    {money(pkg.price)}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "0.84rem" }}>
                    {pkg.duration}
                  </p>
                </div>

                {/* Inclusions */}
                <ul style={{ listStyle: "none", margin: "4px 0 0", padding: "16px 0 6px", borderTop: "1px solid #FFFFFF", display: "grid", gap: 11, flex: 1 }}>
                  {(pkg.includes || []).map((item) => (
                    <li key={item} style={{ display: "flex", gap: 10, color: "#1A1A1A", fontSize: "0.88rem", lineHeight: 1.4 }}>
                      <span style={{ color: "#5A1A14", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={checkoutHref}
                  style={{
                    display: "block",
                    marginTop: "auto",
                    width: "100%",
                    minHeight: 52,
                    borderRadius: 12,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    textAlign: "center",
                    lineHeight: "52px",
                    border: featured ? "none" : "1px solid #E5E7EB",
                    background: featured ? "#5A1A14" : "#ffffff",
                    color: featured ? "#ffffff" : "#1A1A1A",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onMouseEnter={(e) => {
                    if (featured) { e.currentTarget.style.background = "#5A1A14"; }
                    else { e.currentTarget.style.borderColor = "#5A1A14"; e.currentTarget.style.color = "#5A1A14"; }
                  }}
                  onMouseLeave={(e) => {
                    if (featured) { e.currentTarget.style.background = "#5A1A14"; }
                    else { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#1A1A1A"; }
                  }}
                >
                  Continue to Checkout →
                </a>
              </div>
            );
          })}
        </div>

        {/* Custom package banner */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          marginTop: 36,
          padding: "32px 36px",
          border: "1px solid #FFFFFF",
          borderRadius: 14,
          background: "#ffffff",
          boxShadow: "0 14px 34px rgba(0,0,0,0.04)",
          flexWrap: "wrap",
        }}>
          <div>
            <p style={{ margin: "0 0 6px", color: "#6B7280", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Custom Package Plan
            </p>
            <h3 style={{ margin: "0 0 8px", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: "1.3rem", fontWeight: 500, letterSpacing: "-0.01em", color: "#1A1A1A" }}>
              Need something tailored to your business?
            </h3>
            <p style={{ margin: 0, color: "#6B7280", fontSize: "0.9rem", lineHeight: 1.55 }}>
              Tell us about your requirements and we'll put together a custom plan that fits your goals, timeline, and budget.
            </p>
          </div>
          <a
            href="mailto:contact@thecopperstudio.com"
            style={{
              flexShrink: 0,
              display: "inline-block",
              padding: "14px 28px",
              background: "#5A1A14",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 10,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#5A1A14"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#5A1A14"; }}
          >
            Get a Custom Quote
          </a>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 56, borderTop: "1px solid #FFFFFF", paddingTop: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong style={{ fontSize: "0.9rem", color: "#1A1A1A" }}>The Copper Studio</strong>
            <small style={{ display: "block", marginTop: 3, color: "#6B7280", fontSize: "0.78rem" }}>
              © 2024 The Copper Studio. Secure checkout guaranteed.
            </small>
          </div>
          <nav style={{ display: "flex", gap: 20 }}>
            {["Privacy Policy", "Terms of Service", "Support"].map((link) => (
              <a key={link} href="#" style={{ fontSize: "0.82rem", color: "#6B7280", textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#5A1A14"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#6B7280"; }}
              >{link}</a>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
}
