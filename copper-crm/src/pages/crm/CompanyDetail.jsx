import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2, FolderKanban, Mail, Phone, TrendingUp } from "lucide-react";
import { Avatar, Button, Card, StatusBadge } from "../../components/ui";
import { companies as fallbackCompanies, contacts, projects } from "../../data/mockData";
import Breadcrumb from "../../components/Breadcrumb";
import ProjectCard from "../../components/ProjectCard";
import { useCrmRecords } from "../../hooks/useCrmRecords";
import { useToast } from "../../components/useToast";

export default function CompanyDetail() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { records: companies } = useCrmRecords("companies", fallbackCompanies);

  const company = useMemo(() => companies.find((c) => String(c.id) === companyId), [companies, companyId]);
  const companyProjects = useMemo(
    () => projects.filter((p) => String(p.companyId) === companyId),
    [companyId]
  );
  const companyContacts = useMemo(
    () => (company ? contacts.filter((c) => c.company === company.name) : []),
    [company]
  );

  if (!company) {
    return (
      <div className="rounded-2xl border border-[#d8c2b9] bg-[#fff8f6] p-10 text-center">
        <p className="text-sm font-semibold text-[#6c6355]">We couldn't find that company.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate("/admin/companies")}>Back to Companies</Button>
      </div>
    );
  }

  const avgProgress = companyProjects.length
    ? Math.round(companyProjects.reduce((sum, p) => sum + p.progress, 0) / companyProjects.length)
    : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Breadcrumb items={[{ label: "Companies", to: "/admin/companies" }, { label: company.name, to: null }]} />
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#d8c2b9] bg-[#fff1ec] text-[#884c2d]">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[#211a17]">{company.name}</h2>
              <p className="text-sm text-[#6c6355]">{company.industry}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={company.status} />
            {company.gstin && (
              <span className="rounded-full bg-[#ede0db] px-3 py-1 font-mono text-[11px] font-bold text-[#6c6355]">GSTIN {company.gstin}</span>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => showToast({ title: "Coming soon", message: "Creating projects from here is on the roadmap." })}
        >
          <FolderKanban size={15} /> New Project
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <FolderKanban size={18} className="text-[#884c2d]" />
          <p className="mt-3 text-2xl font-bold text-[#211a17]">{companyProjects.length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6c6355]">Projects</p>
        </Card>
        <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <TrendingUp size={18} className="text-[#026769]" />
          <p className="mt-3 text-2xl font-bold text-[#211a17]">{avgProgress}%</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6c6355]">Avg. Progress</p>
        </Card>
        <Card className="p-5 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
          <Building2 size={18} className="text-[#884c2d]" />
          <p className="mt-3 text-2xl font-bold text-[#211a17]">{companyContacts.length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-[#6c6355]">Contacts on file</p>
        </Card>
      </section>

      <section>
        <h3 className="font-display mb-4 text-lg font-semibold text-[#211a17]">Projects</h3>
        {companyProjects.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companyProjects.map((project) => (
              <ProjectCard key={project.id} project={project} showClient={false} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#d8c2b9] p-10 text-center text-sm text-[#6c6355]">
            No projects yet for {company.name}.
          </p>
        )}
      </section>

      {companyContacts.length > 0 && (
        <section>
          <h3 className="font-display mb-4 text-lg font-semibold text-[#211a17]">Contacts</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companyContacts.map((contact) => (
              <Card key={contact.id} className="flex items-center gap-3 p-4 shadow-[0_18px_40px_rgba(79,39,16,0.06)]">
                <Avatar name={contact.name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#211a17]">{contact.name}</p>
                  <p className="truncate text-xs text-[#6c6355]">{contact.designation}</p>
                  <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-[#6c6355]">
                    <span className="inline-flex items-center gap-1 truncate"><Mail size={11} />{contact.email}</span>
                    <span className="inline-flex items-center gap-1"><Phone size={11} />{contact.phone}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
