import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { partnerships, partnerEvents } from "@/mock/partnerships";
import { Globe, Users, Briefcase, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/partnerships")({
  head: () => ({ meta: [{ title: "Partenariats — Admin. Établissement" }] }),
  component: AdminPartnerships,
});

function AdminPartnerships() {
  const activePartnerships = partnerships.filter(p => p.status === "Actif");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin. · INSAT" title="Partenariats & Mobilité" description="Accords internationaux, industriels et gestion des mobilités." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Partenaires Actifs" description={`${activePartnerships.length} accords en vigueur`}>
          <div className="space-y-3">
            {activePartnerships.map((p) => (
              <div key={p.id} className="p-3 border border-border rounded-lg bg-card">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-semibold text-sm">{p.partnerName}</div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider",
                    p.type === "Académique" ? "bg-navy/10 text-navy border-navy/20" : "bg-gold/10 text-gold border-gold/20")}>
                    {p.type}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                  <Globe className="size-3" /> {p.region}
                  <span className="mx-1">•</span>
                  <Briefcase className="size-3" /> {p.scope}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Événements Partenaires" description="Dates clés à venir">
          <div className="space-y-3">
            {partnerEvents.filter(e => e.status === "upcoming").map((e) => (
              <div key={e.id} className="flex gap-4 items-start p-3 border border-border rounded-lg bg-card">
                <div className="size-10 rounded bg-muted/40 flex items-center justify-center shrink-0">
                  <Calendar className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{e.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(e.date).toLocaleDateString("fr-FR")} · {e.partnerName}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
