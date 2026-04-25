import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { ShieldAlert, AlertTriangle, Bell, CheckCircle2, XOctagon, TrendingDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/alerts")({
  head: () => ({
    meta: [
      { title: "Centre d'alertes — Directeur" },
      { name: "description", content: "Gestion des urgences et anomalies détectées par le système." },
    ],
  }),
  component: DirectorAlerts,
});

const ALERTS = [
  { id: 1, title: "Taux d'absence critique — L3 GL", desc: "Le groupe L3-GL-A affiche 38% d'absence sur les 2 dernières semaines. Seuil déclenché : 25%.", severity: "critical", module: "Présence", time: "Il y a 2h", resolved: false },
  { id: 2, title: "Dépassement budgétaire — Maintenance", desc: "La ligne budgétaire maintenance atteint 92% de consommation à 7 mois d'exercice.", severity: "warning", module: "Finance", time: "Il y a 5h", resolved: false },
  { id: 3, title: "Serveur e-scolarité — latence élevée", desc: "Temps de réponse moyen > 3s sur le portail e-scolarité. Impact potentiel sur les inscriptions.", severity: "critical", module: "Infra. IT", time: "Hier", resolved: false },
  { id: 4, title: "Chute du taux de satisfaction — Physique", desc: "Le score de satisfaction des étudiants en Physique a chuté de 4.2 à 2.8 cette session.", severity: "warning", module: "Pédagogie", time: "Hier", resolved: false },
  { id: 5, title: "Anomalie de pointage — Personnel", desc: "3 fiches de pointage incomplètes détectées pour le mois d'avril. Agents concernés notifiés.", severity: "info", module: "RH", time: "Il y a 3j", resolved: true },
  { id: 6, title: "Mise à jour réglementaire", desc: "Nouvelle circulaire MESRS concernant les examens de rattrapage. Action requise avant le 15 mai.", severity: "info", module: "Réglementaire", time: "Il y a 4j", resolved: true },
];

function DirectorAlerts() {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [showResolved, setShowResolved] = useState(false);

  const filtered = ALERTS.filter((a) => {
    if (filter !== "all" && a.severity !== filter) return false;
    if (!showResolved && a.resolved) return false;
    return true;
  });

  const critCount = ALERTS.filter((a) => a.severity === "critical" && !a.resolved).length;
  const warnCount = ALERTS.filter((a) => a.severity === "warning" && !a.resolved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · INSAT"
        title="Centre d'Alertes"
        description="Anomalies, urgences et notifications système nécessitant votre attention."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Alertes actives" value={ALERTS.filter((a) => !a.resolved).length} hint="Non résolues" accent="destructive" />
        <StatCard label="Critiques" value={critCount} hint="Action immédiate" accent="destructive" />
        <StatCard label="Avertissements" value={warnCount} hint="À surveiller" accent="warning" />
        <StatCard label="Résolues ce mois" value={ALERTS.filter((a) => a.resolved).length} hint="Traitées" accent="success" />
      </div>

      <Section title="Fil d'alertes" description="Classées par urgence">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "critical", "warning", "info"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filter === f ? "bg-navy text-white" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "all" ? "Toutes" : f === "critical" ? "🔴 Critiques" : f === "warning" ? "🟡 Avertissements" : "🔵 Info"}
              </button>
            ))}
            <button
              onClick={() => setShowResolved(!showResolved)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors ml-auto",
                showResolved ? "bg-success/10 text-success" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {showResolved ? "✓ Résolues affichées" : "Afficher résolues"}
            </button>
          </div>

          <div className="space-y-3">
            {filtered.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "p-4 rounded-xl border flex items-start gap-4 transition-colors",
                  a.resolved ? "bg-muted/30 border-border opacity-70" :
                  a.severity === "critical" ? "bg-destructive/5 border-destructive/30" :
                  a.severity === "warning" ? "bg-warning/5 border-warning/30" :
                  "bg-info/5 border-info/30"
                )}
              >
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0",
                  a.severity === "critical" ? "bg-destructive/10 text-destructive" :
                  a.severity === "warning" ? "bg-warning/10 text-warning" :
                  "bg-info/10 text-info"
                )}>
                  {a.severity === "critical" ? <XOctagon className="size-5" /> :
                   a.severity === "warning" ? <AlertTriangle className="size-5" /> :
                   <Bell className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{a.title}</h3>
                    {a.resolved && <CheckCircle2 className="size-4 text-success shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase tracking-wider">{a.module}</span>
                    <span className="text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="size-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm">Aucune alerte dans cette catégorie.</p>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
