import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { institutions } from "@/mock/institutions";
import { universityFinancials } from "@/mock/financials";
import { useUIStore } from "@/stores/uiStore";
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { Sparkles, Globe2, Building2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, RefreshCw, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useEquitableEmploymentAPI } from "@/hooks/useEquitableEmploymentAPI";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord Global — UCAR" }] }),
  component: SuperAdminDashboard,
});

const NATIONAL_TREND = [
  { month: "Jan", enrolled: 28400, graduates: 0 },
  { month: "Mar", enrolled: 28800, graduates: 0 },
  { month: "Jun", enrolled: 29100, graduates: 3200 },
  { month: "Sep", enrolled: 30100, graduates: 0 },
  { month: "Oct", enrolled: 30450, graduates: 0 },
  { month: "Nov", enrolled: 30620, graduates: 0 },
];

const AI_INSIGHTS = [
  { type: "Risque", title: "FST Tunis — Dépassement budgétaire", msg: "Exécution à 102%. Intervention recommandée." },
  { type: "Performance", title: "ENIT — Meilleure progression GPA", msg: "+0.4 pts vs année dernière. Diffuser les bonnes pratiques." },
  { type: "Prédiction", title: "3 établissements à risque abandon", msg: "Modèle IA prédit une hausse de 8% des abandons en S2." },
  { type: "ESG", title: "Réduction carbone en bonne voie", msg: "-7% d'émissions sur les 3 derniers mois. Objectif 2025 atteignable." },
];

function SuperAdminDashboard() {
  const openCopilot = useUIStore((s) => s.openCopilot);
  const { submitTask } = useAgentTask();
  const { evaluateAsMarkdown } = useEquitableEmploymentAPI();
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorOutput, setAdvisorOutput] = useState<string>("");

  const totalEnrolled = 30620;
  const atRisk = universityFinancials.filter(u => u.status === "at risk" || u.status === "critical").length;

  const handleEmploymentAgent = async () => {
    setAdvisorLoading(true);
    setAdvisorOutput("");
    openCopilot(); // Opens the side panel

    await submitTask({
      type: "analytics_agent",
      description: "Évaluation de l'Équité d'Emploi (Equitable Employment Agent)",
      payload: { source: "equitable_employment_agent", institution: "Réseau UCAR" },
      externalRun: async () => {
        const output = await evaluateAsMarkdown();
        setAdvisorOutput(output);
        return output;
      }
    });
    setAdvisorLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · Université de Carthage"
        title="Vue Nationale — 30+ Établissements"
        description="Pilotage centralisé de l'Université de Carthage : tous établissements, toutes métriques."
        actions={
          <div className="flex gap-2">
            <Button onClick={handleEmploymentAgent} disabled={advisorLoading} variant="outline" className="border-gold/40 gap-2">
              <Sparkles className="size-4 text-gold" />
              Tâche Agent: Équité d'emploi
            </Button>
            <Button variant="outline" className="gap-2"><RefreshCw className="size-4" />Sync données</Button>
            <Button onClick={openCopilot} variant="outline" className="border-gold/40 gap-2"><Sparkles className="size-4 text-gold" />IA Copilot</Button>
          </div>
        }
      />

      {advisorOutput && (
        <Section
          title="Rapport de l'Agent d'Équité d'Emploi"
          description="Résultat généré par l'API Python d'analyse de la masse salariale"
        >
          <div className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/30 p-4 whitespace-pre-wrap">
            <ReactMarkdown>{advisorOutput}</ReactMarkdown>
          </div>
        </Section>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-[#0d2654] to-navy/60 border border-navy/40 px-6 py-7 text-white">
        <div className="absolute inset-0 ucar-grid-bg opacity-10" />
        <div className="absolute -bottom-14 -right-14 size-60 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80 font-medium mb-1">Réseau Université de Carthage</div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-6xl font-bold">{totalEnrolled.toLocaleString("fr-FR")}</span>
              <span className="text-white/50 text-2xl">étudiants</span>
            </div>
            <div className="mt-2 text-sm text-white/70">{institutions.length}+ établissements · 1 campus numérique commun</div>
          </div>
          <div className="sm:ml-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: "Établissements", v: "32" },
              { l: "Programmes", v: "248" },
              { l: "Enseignants", v: "1 840" },
              { l: "Publications", v: "412" },
            ].map((k) => (
              <div key={k.l} className="text-center px-4 py-3 rounded-xl bg-white/10 border border-white/15">
                <div className="font-display text-2xl font-bold">{k.v}</div>
                <div className="text-[10px] text-white/50 mt-0.5 uppercase tracking-wider whitespace-nowrap">{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Établissements actifs" value={32} hint="33e en création" accent="navy" />
        <StatCard label="À risque" value={atRisk} hint="Budget ou abandon" accent={atRisk > 0 ? "destructive" : "success"} />
        <StatCard label="Taux réussite moyen" value="76.4%" hint="+1.8% vs 2023" trend="up" delta="+1.8%" accent="success" />
        <StatCard label="Score ESG moyen" value="62/100" hint="Objectif : 75" accent="gold" />
      </div>

      {/* AI Insights */}
      <Section title="Insights IA — Réseau UCAR" description="Analyse automatisée de l'ensemble des établissements" actions={<Sparkles className="size-4 text-gold" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {AI_INSIGHTS.map((ins, i) => (
            <div key={i} className={cn("p-4 rounded-xl border flex gap-3",
              ins.type === "Risque" ? "border-destructive/20 bg-destructive/5" : ins.type === "Performance" ? "border-success/20 bg-success/5" : ins.type === "Prédiction" ? "border-warning/20 bg-warning/5" : "border-info/20 bg-info/5")}>
              <div className={cn("size-2 rounded-full mt-2 shrink-0",
                ins.type === "Risque" ? "bg-destructive" : ins.type === "Performance" ? "bg-success" : ins.type === "Prédiction" ? "bg-warning" : "bg-info")} />
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{ins.type}</span>
                <div className="font-semibold text-sm mt-0.5">{ins.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{ins.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Enrollment trend */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Évolution des inscriptions" description="Réseau UCAR 2024">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={NATIONAL_TREND} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="enrolled" stroke="var(--gold)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--gold)" }} name="Inscrits" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Budget health grid */}
        <Section title="Santé budgétaire par établissement" description="Exécution 2024">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={universityFinancials} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} unit="%" domain={[0, 110]} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Exécution"]} />
                <Bar dataKey="executionRate" radius={[4, 4, 0, 0]} name="Exécution">
                  {universityFinancials.map((e, i) => (
                    <Cell key={i} fill={e.status === "critical" ? "var(--destructive)" : e.status === "at risk" ? "var(--warning)" : "var(--chart-4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-2">
            {[["Normal", "chart-4"], ["À risque", "warning"], ["Critique", "destructive"]].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: `var(--${c})` }} />{l}</span>
            ))}
          </div>
        </Section>
      </div>

      {/* Institution table */}
      <Section title="État des établissements" description="Résumé par institution">
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Établissement</th>
                <th className="px-5 py-3 text-right font-medium">Budget alloué</th>
                <th className="px-5 py-3 text-right font-medium">Consommé</th>
                <th className="px-5 py-3 text-center font-medium">Exécution</th>
                <th className="px-5 py-3 text-center font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {universityFinancials.map((u, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{u.allocated.toLocaleString("fr-FR")} DT</td>
                  <td className="px-5 py-3 text-right">{u.consumed.toLocaleString("fr-FR")} DT</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", u.executionRate > 100 ? "bg-destructive" : u.executionRate > 90 ? "bg-warning" : "bg-success")}
                          style={{ width: `${Math.min(u.executionRate, 100)}%` }} />
                      </div>
                      <span className={cn("text-xs font-bold w-8", u.executionRate > 100 ? "text-destructive" : "text-foreground")}>{u.executionRate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider",
                      u.status === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" : u.status === "at risk" ? "bg-warning/10 text-warning border-warning/30" : "bg-success/10 text-success border-success/30")}>
                      {u.status === "critical" ? <AlertTriangle className="size-3" /> : u.status === "on track" ? <CheckCircle2 className="size-3" /> : null}
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ESG Dashboard embedded section */}
      <Section title="ESG / CSR Energy Consumption & Carbon Footprint" description="Tableau de bord d'analyse environnementale et bilans carbones. Données issues du modèle IA local.">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden h-[650px] shadow-sm">
            <iframe src="/esg_dashboard.html" className="w-full h-full border-0" title="ESG Environmental Dashboard" />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="size-4 text-success" />
                <h3 className="font-semibold text-sm">Advisory Assessment</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le modèle environnemental détecte une hausse de 12% de la consommation énergétique sur le réseau UCAR. 
                L'installation de panneaux solaires permettrait une réduction de 20% de l'empreinte carbone globale d'ici 2026.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-warning" />
                <h3 className="font-semibold text-sm">Alerte Déchets</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Les indicateurs de tri sélectif montrent une baisse d'efficacité. Recommandation: relancer la campagne de sensibilisation inter-établissements.
              </p>
            </div>
            <Button variant="outline" className="w-full gap-2 mt-auto">
              Télécharger les données CSV
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
