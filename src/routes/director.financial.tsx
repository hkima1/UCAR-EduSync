import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { Wallet, TrendingUp, Receipt, AlertTriangle, Download, ArrowRight } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/financial")({
  head: () => ({
    meta: [
      { title: "Gestion Financière — Directeur" },
      { name: "description", content: "Vision macroscopique du budget de l'établissement." },
    ],
  }),
  component: DirectorFinancial,
});

const BUDGET_BY_CAT = [
  { category: "Personnel", budget: 1200000, consumed: 980000 },
  { category: "Fonctionn.", budget: 400000, consumed: 320000 },
  { category: "Équipement", budget: 250000, consumed: 190000 },
  { category: "Recherche", budget: 180000, consumed: 95000 },
  { category: "Maintenance", budget: 120000, consumed: 110000 },
  { category: "Numérique", budget: 80000, consumed: 45000 },
];

const RECENT_PO = [
  { id: "BC-2025-142", desc: "Matériel informatique TP IoT", amount: 12400, dept: "Dép. Informatique", date: "2025-04-20", status: "approved" },
  { id: "BC-2025-138", desc: "Climatisation Amphi Carthage", amount: 8900, dept: "Services Généraux", date: "2025-04-15", status: "approved" },
  { id: "BC-2025-145", desc: "Licences logicielles MATLAB", amount: 5200, dept: "Dép. Math. App.", date: "2025-04-22", status: "pending" },
  { id: "BC-2025-147", desc: "Mobilier salle de réunion B204", amount: 3100, dept: "Administration", date: "2025-04-24", status: "pending" },
];

function DirectorFinancial() {
  const totalBudget = BUDGET_BY_CAT.reduce((s, c) => s + c.budget, 0);
  const totalConsumed = BUDGET_BY_CAT.reduce((s, c) => s + c.consumed, 0);
  const consumptionRate = Math.round((totalConsumed / totalBudget) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · INSAT"
        title="Gestion Financière"
        description="Budget macroscopique, suivi des dépenses et bons de commande."
        actions={
          <Button variant="outline" className="gap-2">
            <Download className="size-4" /> Exporter le rapport
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Budget total" value={`${(totalBudget / 1e6).toFixed(1)}M DT`} hint="Exercice 2025" accent="navy" />
        <StatCard label="Consommé" value={`${(totalConsumed / 1e6).toFixed(1)}M DT`} hint={`${consumptionRate}% du budget`} trend="up" delta={`${consumptionRate}%`} accent="gold" />
        <StatCard label="Reste à engager" value={`${((totalBudget - totalConsumed) / 1e6).toFixed(1)}M DT`} hint="Avant clôture" accent="success" />
        <StatCard label="BC en attente" value="2" hint="Validation requise" accent="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Consommation par catégorie" description="Budget vs dépenses (DT)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={BUDGET_BY_CAT} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `${(v / 1000)}k`} />
                <YAxis dataKey="category" type="category" stroke="var(--muted-foreground)" fontSize={11} width={85} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} formatter={(v: number) => `${v.toLocaleString("fr-FR")} DT`} />
                <Bar dataKey="budget" fill="var(--navy)" radius={[0, 4, 4, 0]} name="Budget" opacity={0.3} />
                <Bar dataKey="consumed" fill="var(--navy)" radius={[0, 4, 4, 0]} name="Consommé" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-3 justify-center">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy/30" />Budget alloué</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy" />Consommé</span>
          </div>
        </Section>

        <Section title="Derniers bons de commande" description="Demandes d'achat récentes">
          <div className="space-y-3">
            {RECENT_PO.map((po) => (
              <div key={po.id} className="p-3 rounded-lg border border-border bg-card hover:border-gold/30 transition-colors">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <div className="font-semibold text-sm">{po.desc}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {po.id} · {po.dept} · {new Date(po.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm">{po.amount.toLocaleString("fr-FR")} DT</div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium",
                      po.status === "approved"
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-warning/10 text-warning border-warning/30"
                    )}>
                      {po.status === "approved" ? "Approuvé" : "En attente"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
