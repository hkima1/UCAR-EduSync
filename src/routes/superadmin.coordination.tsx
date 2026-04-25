import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { Megaphone, FileText, Calendar, CheckCircle2, Clock, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/coordination")({
  head: () => ({
    meta: [
      { title: "Coordination — UCAR" },
      { name: "description", content: "Gestion des directives ministérielles et coordination inter-établissements." },
    ],
  }),
  component: SuperAdminCoordination,
});

const DIRECTIVES = [
  { id: 1, ref: "DIR-2025-18", title: "Nouveau barème des heures supplémentaires", source: "MESRS", date: "2025-04-20", deadline: "2025-05-15", compliance: 12, total: 32, status: "active" },
  { id: 2, ref: "DIR-2025-14", title: "Digitalisation des inscriptions — Phase 2", source: "MESRS", date: "2025-03-01", deadline: "2025-09-01", compliance: 24, total: 32, status: "active" },
  { id: 3, ref: "DIR-2025-11", title: "Référentiel LMD — Mise à jour des maquettes", source: "MESRS", date: "2025-01-15", deadline: "2025-06-30", compliance: 28, total: 32, status: "active" },
  { id: 4, ref: "DIR-2024-42", title: "Accessibilité des campus — audit obligatoire", source: "MFPE", date: "2024-11-10", deadline: "2025-03-31", compliance: 32, total: 32, status: "completed" },
];

const COMMITTEES = [
  { id: 1, name: "Comité de Pilotage Numérique", date: "2025-05-08", participants: 18, status: "upcoming" },
  { id: 2, name: "Commission Partenariats Internationaux", date: "2025-05-15", participants: 12, status: "upcoming" },
  { id: 3, name: "Comité Qualité & Accréditation", date: "2025-04-22", participants: 22, status: "completed" },
  { id: 4, name: "Commission d'Équivalence des Diplômes", date: "2025-04-10", participants: 8, status: "completed" },
];

const CIRCULARS = [
  { ref: "CIR-2025-07", title: "Calendrier des examens — Session principale S2", date: "2025-04-18" },
  { ref: "CIR-2025-06", title: "Bourses de mobilité Erasmus+ — Appel 2025", date: "2025-04-05" },
  { ref: "CIR-2025-05", title: "Journée portes ouvertes — Coordination nationale", date: "2025-03-20" },
];

function SuperAdminCoordination() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · UCAR"
        title="Coordination Inter-établissements"
        description="Directives ministérielles, comités inter-universitaires et circulaires de coordination."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Directives actives" value="3" hint="En cours d'application" accent="navy" />
        <StatCard label="Taux de conformité" value="78%" hint="Moyenne réseau" trend="up" delta="+5%" accent="success" />
        <StatCard label="Comités planifiés" value="2" hint="Ce mois-ci" accent="gold" />
        <StatCard label="Circulaires émises" value="7" hint="Année 2025" accent="info" />
      </div>

      <Section title="Directives ministérielles" description="Suivi de conformité par établissement">
        <div className="space-y-4">
          {DIRECTIVES.map((d) => (
            <div key={d.id} className={cn("p-4 rounded-xl border", d.status === "completed" ? "border-success/30 bg-success/5" : "border-border bg-card")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-mono">{d.ref}</span>
                    <span className="text-[10px] text-muted-foreground">{d.source}</span>
                  </div>
                  <h3 className="font-semibold text-sm">{d.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1"><Calendar className="size-3" />Émise: {new Date(d.date).toLocaleDateString("fr-FR")}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" />Échéance: {new Date(d.deadline).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                {d.status === "completed" ? (
                  <CheckCircle2 className="size-5 text-success shrink-0" />
                ) : (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium shrink-0",
                    d.compliance / d.total >= 0.8 ? "bg-success/10 text-success border-success/30" :
                    d.compliance / d.total >= 0.5 ? "bg-warning/10 text-warning border-warning/30" :
                    "bg-destructive/10 text-destructive border-destructive/30"
                  )}>
                    {d.compliance}/{d.total} conformes
                  </span>
                )}
              </div>
              {d.status !== "completed" && (
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${(d.compliance / d.total) * 100}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground mt-1">{Math.round((d.compliance / d.total) * 100)}% des établissements conformes</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Comités inter-universitaires" description="Sessions planifiées et passées">
          <div className="space-y-3">
            {COMMITTEES.map((c) => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                <div className="text-center shrink-0 w-14">
                  <div className="text-[10px] uppercase text-muted-foreground">{new Date(c.date).toLocaleDateString("fr-FR", { month: "short" })}</div>
                  <div className="text-xl font-display font-bold text-navy">{new Date(c.date).getDate()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="size-3" />{c.participants} participants</div>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium",
                  c.status === "upcoming" ? "bg-navy/10 text-navy border-navy/20" : "bg-success/10 text-success border-success/30"
                )}>
                  {c.status === "upcoming" ? "À venir" : "Terminé"}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Circulaires récentes" description="Notes de service et communications">
          <div className="space-y-3">
            {CIRCULARS.map((c) => (
              <div key={c.ref} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <Megaphone className="size-5 text-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.ref} · {new Date(c.date).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
