import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { FileText, Download, Calendar, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/reports")({
  head: () => ({
    meta: [
      { title: "Rapports d'activité — Directeur" },
      { name: "description", content: "Rédaction assistée des rapports annuels et indicateurs." },
    ],
  }),
  component: DirectorReports,
});

const REPORTS = [
  { id: 1, title: "Bilan Annuel 2024-2025", type: "Rapport annuel", date: "2025-04-15", status: "draft", pages: 42 },
  { id: 2, title: "Rapport Ministère — Indicateurs MESRS", type: "Ministère", date: "2025-03-20", status: "submitted", pages: 18 },
  { id: 3, title: "Bilan Recherche & Innovation", type: "Recherche", date: "2025-02-10", status: "approved", pages: 24 },
  { id: 4, title: "Rapport de Performance Pédagogique", type: "Pédagogie", date: "2025-01-28", status: "approved", pages: 15 },
  { id: 5, title: "Évaluation ESG & Développement Durable", type: "ESG", date: "2024-12-15", status: "approved", pages: 12 },
];

const KPI_SUMMARY = [
  { label: "Taux de réussite global", value: "81%", target: "85%", status: "warning" },
  { label: "Taux d'insertion professionnelle", value: "72%", target: "70%", status: "success" },
  { label: "Publications scientifiques", value: "34", target: "30", status: "success" },
  { label: "Taux de satisfaction étudiante", value: "3.8/5", target: "4.0/5", status: "warning" },
  { label: "Projets de recherche actifs", value: "12", target: "10", status: "success" },
  { label: "Partenariats internationaux", value: "8", target: "12", status: "warning" },
];

function DirectorReports() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · INSAT"
        title="Rapports d'Activité"
        description="Génération assistée des bilans annuels, rapports ministériels et synthèses d'indicateurs."
        actions={
          <Button className="gap-2">
            <FileText className="size-4" /> Générer un rapport
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rapports générés" value="5" hint="Année universitaire en cours" accent="navy" />
        <StatCard label="En attente" value="1" hint="Brouillon à finaliser" accent="warning" />
        <StatCard label="Soumis" value="1" hint="En cours de revue" accent="info" />
        <StatCard label="Validés" value="3" hint="Publiés / archivés" accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="Rapports récents" description="Documents générés et leur statut">
          <div className="space-y-3">
            {REPORTS.map((r) => (
              <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-gold/40 transition-colors">
                <div className={cn(
                  "size-11 rounded-lg flex items-center justify-center shrink-0",
                  r.status === "draft" ? "bg-warning/10 text-warning" :
                  r.status === "submitted" ? "bg-info/10 text-info" :
                  "bg-success/10 text-success"
                )}>
                  <FileText className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {r.type} · {r.pages} pages · {new Date(r.date).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium",
                    r.status === "draft" ? "bg-warning/10 text-warning border-warning/30" :
                    r.status === "submitted" ? "bg-info/10 text-info border-info/30" :
                    "bg-success/10 text-success border-success/30"
                  )}>
                    {r.status === "draft" ? "Brouillon" : r.status === "submitted" ? "Soumis" : "Validé"}
                  </span>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="size-3.5" /> PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="KPIs Annuels" description="Synthèse des indicateurs clés" actions={<BarChart3 className="size-4 text-muted-foreground" />}>
          <div className="space-y-3">
            {KPI_SUMMARY.map((kpi, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium">{kpi.label}</span>
                  {kpi.status === "success" ? (
                    <CheckCircle2 className="size-3.5 text-success" />
                  ) : (
                    <Clock className="size-3.5 text-warning" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-display font-bold">{kpi.value}</span>
                  <span className="text-[10px] text-muted-foreground">/ Objectif: {kpi.target}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
