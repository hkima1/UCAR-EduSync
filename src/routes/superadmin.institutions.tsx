import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { institutions } from "@/mock/institutions";
import { Building2, MapPin, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

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
          {institutions.map((inst) => (
            <div key={inst.id} className="group p-5 border border-border bg-card rounded-2xl hover:border-gold/40 transition-colors cursor-pointer text-left">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-xl bg-navy/10 border-2 border-navy flex items-center justify-center shrink-0">
                  <Building2 className="size-6 text-navy" />
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase font-medium",
                  inst.status === "active" ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30")}>
                  {inst.status}
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg">{inst.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{inst.description}</p>
              
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><MapPin className="size-3" /> {inst.location}</div>
                <div className="flex items-center gap-1.5"><Users className="size-3" /> {inst.studentCount} étud.</div>
                <div className="flex items-center gap-1.5"><Globe className="size-3" /> {inst.type}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
