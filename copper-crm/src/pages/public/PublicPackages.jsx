import { ArrowRight, CheckCircle2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../lib/api";

const FALLBACK_PACKAGES = [
  {
    id: "starter",
    name: "Starter Studio",
    label: "For new client onboarding",
    price: 24999,
    duration: "30 days setup",
    includes: ["Package setup", "Client intake form", "Payment checkout", "Email confirmation"]
  },
  {
    id: "growth",
    name: "Growth Studio",
    label: "Most selected",
    price: 49999,
    duration: "45 days setup",
    includes: ["Everything in Starter", "Quotation setup", "Razorpay integration", "Priority onboarding"]
  },
  {
    id: "enterprise",
    name: "Enterprise Studio",
    label: "For custom teams",
    price: 89999,
    duration: "60 days setup",
    includes: ["Everything in Growth", "Dedicated setup manager", "Advanced support", "Custom account setup"]
  }
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

  useEffect(() => {
    apiGet("/api/packages")
      .then((data) => {
        if (Array.isArray(data) && data.length) setPackages(data);
      })
      .catch(() => {});
  }, []);

  const featuredId = useMemo(() => packages.find((pkg) => /most|growth/i.test(`${pkg.label} ${pkg.name}`))?.id || packages[1]?.id, [packages]);

  return (
    <main className="min-h-screen bg-[#f7f2ef] text-[#211a17]">
      <header className="border-b border-[#e5d8d1] bg-white/90 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#884c2d]">The Copper Studio</p>
            <h1 className="text-lg font-bold">Pricing Packages</h1>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-[#d8c2b9] bg-white px-3 py-2 text-xs font-bold text-[#6f381a] hover:bg-[#fff1ec]">
            <LogIn size={14} /> Portal Login
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-7 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#884c2d]">Choose a package</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#111827]">Start your client portal setup.</h2>
          <p className="mt-3 text-sm leading-6 text-[#6c6355]">
            Select a package, complete checkout, and receive your secure client portal onboarding link after payment.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {packages.map((pkg) => {
            const featured = pkg.id === featuredId;
            const checkoutHref = backendUrl(`/checkout?package=${encodeURIComponent(pkg.id)}`);
            return (
              <article key={pkg.id} className={`flex min-h-[410px] flex-col rounded-xl border bg-white p-5 shadow-sm ${featured ? "border-[#884c2d] ring-2 ring-[#884c2d]/10" : "border-[#e5d8d1]"}`}>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#884c2d]">{pkg.label}</p>
                    <h3 className="mt-1 text-xl font-bold text-[#111827]">{pkg.name}</h3>
                  </div>
                  {featured && <span className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11px] font-bold text-[#884c2d]">Popular</span>}
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-[#111827]">{money(pkg.price)}</p>
                  <p className="mt-1 text-sm font-medium text-[#6c6355]">{pkg.duration}</p>
                </div>

                <ul className="mb-6 flex-1 space-y-3">
                  {(pkg.includes || []).map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#374151]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={checkoutHref}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold ${featured ? "bg-[#884c2d] text-white hover:bg-[#6f381a]" : "border border-[#d8c2b9] bg-white text-[#6f381a] hover:bg-[#fff1ec]"}`}
                >
                  Continue to Checkout <ArrowRight size={15} />
                </a>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
