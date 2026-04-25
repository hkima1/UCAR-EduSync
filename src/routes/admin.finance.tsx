import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { institutionBudgets, anomalyTransactions, monthlySpend, spendRequests } from "@/mock/financials";
import {
  BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, RadialBarChart, RadialBar, PieChart, Pie, Cell,
} from "recharts";
import { AlertTriangle, CheckCircle2, XCircle, TrendingDown, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/finance")({
  head: () => ({ meta: [{ title: "Finance — Admin. Établissement" }] }),
  component: AdminFinance,
});

const TABS = ["Aperçu", "Budget", "Anomalies", "Risques", "Rapports"] as const;
type Tab = (typeof TABS)[number];

const budgets = institutionBudgets["insat"] ?? [];
const totalAllocated = budgets.reduce((s, d) => s + d.allocated, 0);
const totalConsumed = budgets.reduce((s, d) => s + d.consumed, 0);
const execRate = totalAllocated ? Math.round((totalConsumed / totalAllocated) * 100) : 0;
const PIE_DATA = [{ name: "Consommé", value: totalConsumed }, { name: "Restant", value: totalAllocated - totalConsumed }];

function AdminFinance() {
  const [tab, setTab] = useState<Tab>("Aperçu");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin. · INSAT" title="Finance & Budget" description="Pilotage financier complet : budget, paiements, anomalies, risques et rapports." />

      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", tab === t ? "bg-card shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Aperçu" && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Budget total" value={`${Math.round(totalAllocated / 1000)}k DT`} hint="Exercice 2024" accent="navy" />
            <StatCard label="Consommé" value={`${Math.round(totalConsumed / 1000)}k DT`} hint={`${execRate}% d'exécution`} trend={execRate > 90 ? "down" : "up"} accent={execRate > 90 ? "destructive" : "gold"} />
            <StatCard label="Restant" value={`${Math.round((totalAllocated - totalConsumed) / 1000)}k DT`} accent="success" />
            <StatCard label="Anomalies actives" value={anomalyTransactions.filter(a => a.status === "open").length} hint="Nécessitent action" accent="warning" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Dépenses mensuelles" description="Courbe de consommation 2024">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySpend} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} DT`]} />
                    <Area type="monotone" dataKey="amount" stroke="var(--gold)" strokeWidth={2.5} fill="url(#areaFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
            <Section title="Répartition budgétaire" description="Consommé vs Restant">
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value">
                      <Cell fill="var(--chart-3)" /><Cell fill="var(--muted)" />
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} DT`]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
        </div>
      )}

      {tab === "Budget" && (
        <div className="space-y-4">
          <Section title="Tableau budgétaire par département" description="Exécution détaillée">
            <div className="overflow-x-auto -m-5">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Département</th>
                    <th className="px-5 py-3 text-right font-medium">Alloué</th>
                    <th className="px-5 py-3 text-right font-medium">Consommé</th>
                    <th className="px-5 py-3 text-right font-medium">Restant</th>
                    <th className="px-5 py-3 text-center font-medium">Exécution</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((d, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">{d.department}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{d.allocated.toLocaleString("fr-FR")} DT</td>
                      <td className="px-5 py-3 text-right">{d.consumed.toLocaleString("fr-FR")} DT</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{d.remaining.toLocaleString("fr-FR")} DT</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                            <div className={cn("h-full rounded-full", d.executionRate > 90 ? "bg-destructive" : d.executionRate > 75 ? "bg-gold" : "bg-success")} style={{ width: `${d.executionRate}%` }} />
                          </div>
                          <span className={cn("text-xs font-bold w-8", d.executionRate > 90 ? "text-destructive" : "text-foreground")}>{d.executionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
          <Section title="Demandes de dépenses en attente" description={`${spendRequests.filter(s => s.status === "pending").length} demande(s) à traiter`}>
            <div className="space-y-3">
              {spendRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-muted-foreground/20">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{req.reason}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{req.submittedBy} · {req.department} · {new Date(req.date).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <div className="text-right shrink-0 mr-3">
                    <div className="font-bold">{req.amount.toLocaleString("fr-FR")} DT</div>
                    <span className={cn("text-[10px] uppercase font-medium", req.urgency === "urgent" ? "text-destructive" : "text-muted-foreground")}>{req.urgency}</span>
                  </div>
                  {req.status === "pending" ? (
                    <div className="flex gap-1 shrink-0">
                      <button className="size-8 flex items-center justify-center rounded-lg border border-success/30 bg-success/5 text-success hover:bg-success/10 transition-colors"><CheckCircle2 className="size-4" /></button>
                      <button className="size-8 flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"><XCircle className="size-4" /></button>
                    </div>
                  ) : (
                    <span className="text-xs text-success font-medium shrink-0">{req.status === "approved" ? "Approuvé" : "Rejeté"}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "Anomalies" && (
        <div className="space-y-3">
          {anomalyTransactions.map((anx) => (
            <div key={anx.id} className={cn("p-5 rounded-xl border",
              anx.status === "dismissed" ? "opacity-50 border-border" : anx.severity === "critical" ? "border-destructive/30 bg-destructive/5" : anx.severity === "high" ? "border-warning/30 bg-warning/5" : "border-border")}>
              <div className="flex items-start gap-4">
                <AlertTriangle className={cn("size-5 shrink-0 mt-0.5", anx.severity === "critical" ? "text-destructive" : anx.severity === "high" ? "text-warning" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider",
                      anx.severity === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" : anx.severity === "high" ? "bg-warning/10 text-warning border-warning/30" : "bg-muted text-muted-foreground border-border")}>
                      {anx.severity}
                    </span>
                    <span className="text-sm font-semibold">{anx.type}</span>
                    <span className="text-xs text-muted-foreground">· {anx.department} · {new Date(anx.date).toLocaleDateString("fr-FR")}</span>
                    <span className="font-bold text-sm ml-auto">{anx.amount.toLocaleString("fr-FR")} DT</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{anx.aiExplanation}</p>
                </div>
                {anx.status === "open" && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" className="text-xs">Investiguer</Button>
                    <Button size="sm" variant="outline" className="text-xs text-muted-foreground">Ignorer</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Risques" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Risque de dépassement", value: execRate, unit: "%", danger: execRate > 90, desc: `Exécution à ${execRate}% — budget quasi épuisé`, action: "Gel des dépenses non essentielles" },
            { label: "Couverture masse salariale", value: 68, unit: "jours", danger: false, desc: "Réserve suffisante pour 68 jours de paie", action: "Aucune action requise" },
            { label: "Écart de financement prévu", value: 12, unit: "%", danger: true, desc: "Écart de 12% prévu à fin décembre", action: "Demande d'avance budgétaire recommandée" },
          ].map((risk, i) => (
            <div key={i} className={cn("rounded-xl border p-5 space-y-4", risk.danger ? "border-destructive/30 bg-destructive/5" : "border-border bg-card")}>
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm">{risk.label}</div>
                <TrendingDown className={cn("size-4 shrink-0", risk.danger ? "text-destructive" : "text-muted-foreground")} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={cn("font-display font-bold text-4xl", risk.danger ? "text-destructive" : "text-foreground")}>{risk.value}</span>
                <span className="text-muted-foreground">{risk.unit}</span>
              </div>
              <p className="text-xs text-muted-foreground">{risk.desc}</p>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground">Action suggérée : </span>{risk.action}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Rapports" && (
        <Section title="Génération de rapports financiers" description="Rapports automatisés via IA et agents">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "Rapport financier mensuel", desc: "Bilan complet novembre 2024 avec analyse IA.", type: "Mensuel" },
              { title: "Rapport exécution budgétaire", desc: "Détail par département et recommandations.", type: "Budgétaire" },
              { title: "Synthèse anomalies détectées", desc: "Rapport des transactions suspectes et actions.", type: "Anomalies" },
              { title: "Rapport annuel 2024", desc: "Synthèse complète de l'exercice fiscal.", type: "Annuel" },
            ].map((r, i) => (
              <div key={i} className="p-5 rounded-xl border border-border bg-card hover:border-gold/30 transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{r.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium uppercase tracking-wider shrink-0">{r.type}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full gap-2"><Sparkles className="size-3.5 text-gold" />Générer avec IA</Button>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
