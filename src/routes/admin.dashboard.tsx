import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { institutionBudgets, anomalyTransactions, monthlySpend } from "@/mock/financials";
import { staffMembers, leaveRequests } from "@/mock/staff";
import { useUIStore } from "@/stores/uiStore";
import {
  BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { Wallet, Users, HeartHandshake, FlaskConical, Leaf, Inbox, Sparkles, AlertTriangle, TrendingUp, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — Admin. Établissement" }] }),
  component: AdminDashboard,
});

const budgets = institutionBudgets["insat"] ?? [];
const totalAllocated = budgets.reduce((s, d) => s + d.allocated, 0);
const totalConsumed = budgets.reduce((s, d) => s + d.consumed, 0);
const execRate = totalAllocated ? Math.round((totalConsumed / totalAllocated) * 100) : 0;
const PIE_DATA = [{ name: "Consommé", value: totalConsumed }, { name: "Restant", value: totalAllocated - totalConsumed }];

function AdminDashboard() {
  const openCopilot = useUIStore((s) => s.openCopilot);
  const activeStaff = staffMembers.filter((s) => s.institutionId === "insat");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrateur · INSAT"
        title="Tableau de bord"
        description="Vue consolidée Finance, RH, ESG et demandes de l'établissement."
        actions={<Button onClick={openCopilot} variant="outline" className="border-gold/40 gap-2"><Sparkles className="size-4 text-gold" />IA Copilot</Button>}
      />

      {/* AI Briefing */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/8 via-background to-background px-6 py-5">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="size-10 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0"><Sparkles className="size-5 text-gold" /></div>
          <div>
            <div className="font-display font-semibold">Briefing IA · INSAT</div>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Taux d'exécution budgétaire à <strong className="text-foreground">{execRate}%</strong> — dans les normes.
              Le département Génie Logiciel approche du seuil critique (92%). 
              {leaveRequests.filter(l => l.status === "En attente").length} demandes de congés en attente de validation.
              {anomalyTransactions.filter(a => a.status === "open").length} anomalies financières actives à traiter.
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Exécution budget", value: `${execRate}%`, icon: Wallet, accent: execRate > 90 ? "destructive" as const : "gold" as const },
          { label: "Effectif total", value: activeStaff.length, icon: Users, accent: "navy" as const },
          { label: "Partenariats actifs", value: 4, icon: HeartHandshake, accent: "info" as const },
          { label: "Score ESG", value: "67/100", icon: Leaf, accent: "success" as const },
          { label: "Demandes ouvertes", value: 8, icon: Inbox, accent: "warning" as const },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4 hover:border-gold/30 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{k.label}</span>
              </div>
              <div className="font-display font-bold text-2xl">{k.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budget by dept */}
        <Section className="lg:col-span-2" title="Budget par département" description="Alloué vs Consommé (DT)" actions={<TrendingUp className="size-4 text-muted-foreground" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgets} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="department" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} DT`]} />
                <Bar dataKey="allocated" name="Alloué" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="consumed" name="Consommé" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Budget donut */}
        <Section title="Solde budgétaire" description="Exercice 2024">
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  <Cell fill="var(--chart-3)" />
                  <Cell fill="var(--muted)" />
                </Pie>
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} DT`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {PIE_DATA.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", i === 0 ? "bg-[--chart-3]" : "bg-muted")} />{d.name}</span>
                <span className="font-semibold">{d.value.toLocaleString("fr-FR")} DT</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Monthly spend trend */}
      <Section title="Évolution des dépenses" description="Courbe mensuelle 2024">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlySpend} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${Number(v).toLocaleString("fr-FR")} DT`, "Dépenses"]} />
              <Area type="monotone" dataKey="amount" stroke="var(--gold)" strokeWidth={2.5} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Anomalies */}
      <Section title="Anomalies financières actives" description="Détectées par l'IA — nécessitent une action" actions={<AlertTriangle className="size-4 text-destructive" />}>
        <div className="space-y-3">
          {anomalyTransactions.filter((a) => a.status === "open").map((anx) => (
            <div key={anx.id} className={cn("flex items-start gap-4 p-4 rounded-xl border",
              anx.severity === "critical" ? "border-destructive/30 bg-destructive/5" : anx.severity === "high" ? "border-warning/30 bg-warning/5" : "border-border")}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider",
                    anx.severity === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" : anx.severity === "high" ? "bg-warning/10 text-warning border-warning/30" : "bg-muted text-muted-foreground border-border")}>
                    {anx.severity}
                  </span>
                  <span className="text-sm font-semibold">{anx.type}</span>
                  <span className="text-xs text-muted-foreground">· {anx.department}</span>
                  <span className="text-xs font-bold ml-auto">{anx.amount.toLocaleString("fr-FR")} DT</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{anx.aiExplanation}</p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 text-xs">Investiguer</Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
