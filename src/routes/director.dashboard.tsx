import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { institutions } from "@/mock/institutions";
import { useUIStore } from "@/stores/uiStore";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Minus, CheckCircle2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Directeur" }] }),
  component: DirectorDashboard,
});

const KPIs = [
  { label: "Taux d'inscription", value: "91%", trend: "up", delta: "+3% vs S4" },
  { label: "Taux de réussite", value: "78%", trend: "up", delta: "+2%" },
  { label: "Exécution budget", value: "87%", trend: "flat", delta: "Normal" },
  { label: "Masse salariale", value: "94%", trend: "down", delta: "-6% dispo." },
  { label: "Projets recherche", value: "4 actifs", trend: "up", delta: "+1 ce sem." },
  { label: "Score ESG", value: "67/100", trend: "up", delta: "+4 pts" },
];

const HEALTH_RADAR = [
  { dim: "Académique", val: 78 },
  { dim: "Financier", val: 87 },
  { dim: "RH", val: 65 },
  { dim: "Recherche", val: 80 },
  { dim: "ESG", val: 67 },
  { dim: "Partenariats", val: 74 },
];

const DEPT_TREND = [
  { month: "Sep", Informatique: 14.2, Génie_Civil: 13.1, Électrique: 12.8 },
  { month: "Oct", Informatique: 13.8, Génie_Civil: 13.4, Électrique: 13.0 },
  { month: "Nov", Informatique: 14.1, Génie_Civil: 12.9, Électrique: 13.2 },
];

const ALERTS = [
  { domain: "Finance", severity: "high", title: "Dépassement budget — Génie Logiciel", msg: "Exécution à 102% — gel recommandé." },
  { domain: "RH", severity: "medium", title: "Surcharge enseignante détectée", msg: "Dr. Chaabane et Dr. Souissi : > 20h/sem." },
  { domain: "Académique", severity: "low", title: "Baisse de présence — Réseaux", msg: "Taux 67% — en dessous du seuil 75%." },
];

const TrendIcon = ({ t }: { t: string }) =>
  t === "up" ? <TrendingUp className="size-3.5 text-success" /> : t === "down" ? <TrendingDown className="size-3.5 text-destructive" /> : <Minus className="size-3.5 text-muted-foreground" />;

function DirectorDashboard() {
  const openCopilot = useUIStore((s) => s.openCopilot);
  const healthScore = Math.round(HEALTH_RADAR.reduce((s, d) => s + d.val, 0) / HEALTH_RADAR.length);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · IHEC Carthage"
        title="Tableau de bord Directeur"
        description="Vue stratégique de l'établissement — KPIs, alertes, approbations et pilotage."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="border-border gap-2"><RefreshCw className="size-4" />Actualiser</Button>
            <Button onClick={openCopilot} variant="outline" className="border-gold/40 gap-2"><Sparkles className="size-4 text-gold" />IA Briefing</Button>
          </div>
        }
      />

      {/* Hero health score */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy/85 to-warning/20 border border-navy/30 px-6 py-7 text-white">
        <div className="absolute inset-0 ucar-grid-bg opacity-10" />
        <div className="absolute -top-12 -right-12 size-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80 font-medium mb-1">Score de santé institutionnelle</div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-7xl font-bold text-gold">{healthScore}</span>
              <span className="text-white/40 text-2xl">/100</span>
            </div>
            <div className="mt-2 text-sm text-white/70">Établissement dans un état <strong className="text-white">satisfaisant</strong> — 1 risque majeur à surveiller.</div>
          </div>
          <div className="sm:ml-auto grid grid-cols-3 gap-3">
            {[{ label: "Alertes", val: ALERTS.length }, { label: "Approbations", val: 5 }, { label: "Réunions", val: 2 }].map((k) => (
              <div key={k.label} className="text-center px-4 py-3 rounded-xl bg-white/10 border border-white/15">
                <div className="font-display text-2xl font-bold">{k.val}</div>
                <div className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPIs.map((k, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 hover:border-gold/30 transition-colors">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{k.label}</div>
            <div className="font-display font-bold text-xl">{k.value}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <TrendIcon t={k.trend} />
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Radar */}
        <Section title="Santé institutionnelle" description="Vision multi-dimensionnelle">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={HEALTH_RADAR}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                <Radar dataKey="val" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Grade trend */}
        <Section className="lg:col-span-2" title="Tendance des moyennes par département" description="Sep → Nov 2024">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DEPT_TREND} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis domain={[12, 15]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line dataKey="Informatique" stroke="var(--gold)" strokeWidth={2} dot={{ r: 3 }} name="Informatique" />
                <Line dataKey="Génie_Civil" stroke="var(--info)" strokeWidth={2} dot={{ r: 3 }} name="Génie Civil" />
                <Line dataKey="Électrique" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} name="Électrique" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-2">
            {[["Informatique", "gold"], ["Génie Civil", "info"], ["Électrique", "success"]].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: `var(--${c})` }} />{l}</span>
            ))}
          </div>
        </Section>
      </div>

      {/* Alerts */}
      <Section title="Alertes actives" description="Anomalies et risques détectés automatiquement" actions={<AlertTriangle className="size-4 text-destructive" />}>
        <div className="space-y-3">
          {ALERTS.map((a, i) => (
            <div key={i} className={cn("flex items-start gap-4 p-4 rounded-xl border",
              a.severity === "high" ? "border-destructive/30 bg-destructive/5" : a.severity === "medium" ? "border-warning/30 bg-warning/5" : "border-border")}>
              <AlertTriangle className={cn("size-5 shrink-0 mt-0.5", a.severity === "high" ? "text-destructive" : a.severity === "medium" ? "text-warning" : "text-muted-foreground")} />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium uppercase tracking-wider">{a.domain}</span>
                  <span className="text-sm font-semibold">{a.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{a.msg}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 text-xs">Agir</Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
