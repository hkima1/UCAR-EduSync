import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { institutions } from "@/mock/institutions";
import { Building2, MapPin, Users, GraduationCap, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/superadmin/institutions")({
  head: () => ({ meta: [{ title: "Réseau Établissements — UCAR" }] }),
  component: SuperAdminInstitutions,
});

function SuperAdminInstitutions() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Super Admin · UCAR" title="Cartographie des Établissements" description="Annuaire et pilotage des universités, écoles, et instituts rattachés à l'Université de Carthage." />

      <Section title="Établissements Rattachés" description={`${institutions.length} institutions actives`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(institutions ?? []).map((inst) => (
            <div key={inst.id} className="group p-5 border border-border bg-card rounded-2xl hover:border-gold/40 transition-colors cursor-pointer text-left">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-xl bg-navy/10 border-2 border-navy flex items-center justify-center shrink-0">
                  <Building2 className="size-6 text-navy" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border uppercase font-medium bg-success/10 text-success border-success/30">
                  {inst.type}
                </span>
              </div>
              <h3 className="font-display font-semibold text-base leading-snug">{inst.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{inst.shortName}</p>

              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><MapPin className="size-3" /> {inst.region}</div>
                <div className="flex items-center gap-1.5"><Users className="size-3" /> {inst.enrollment.toLocaleString()} étud.</div>
                <div className="flex items-center gap-1.5"><GraduationCap className="size-3" /> {inst.passRate}% réussite</div>
                <div className="flex items-center gap-1.5"><TrendingUp className="size-3" /> ESG {inst.esgScore}/100</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
