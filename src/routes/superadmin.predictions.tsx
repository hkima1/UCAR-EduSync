import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BrainCircuit, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/predictions")({
  head: () => ({ meta: [{ title: "IA & Prédictions — UCAR" }] }),
  component: SuperAdminPredictions,
});

const DROPOUT_PRED = [
  { month: "S1", actual: 4.2, predicted: 4.5 },
  { month: "S2", actual: 3.8, predicted: 4.0 },
  { month: "S3", actual: 5.1, predicted: 5.4 },
  { month: "S4", actual: null, predicted: 6.2 },
  { month: "S5", actual: null, predicted: 5.8 },
];

function SuperAdminPredictions() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Super Admin · UCAR" title="Moteur de Prédiction IA" description="Anticipation de l'abandon scolaire, évolution des inscriptions et flux de diplomation via Machine Learning." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Prédiction du Risque d'Abandon" description="Taux estimé % par semestre" actions={<BrainCircuit className="size-5 text-gold" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DROPOUT_PRED} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                <Line type="monotone" dataKey="actual" stroke="var(--navy)" strokeWidth={3} name="Taux Réel" />
                <Line type="monotone" dataKey="predicted" stroke="var(--gold)" strokeDasharray="5 5" strokeWidth={3} name="Prédiction IA" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-4">
            <AlertTriangle className="size-5 text-warning shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-warning">Alerte Prédictive : </span>
              Hausse de 20% des abandons prévue au S4 (Filières Licences Fondamentales). Un plan de tutorat est recommandé immédiatement.
            </div>
          </div>
        </Section>

        <Section title="Modèles Actifs">
          <div className="space-y-3">
            {[
              { title: "Prédiction des Inscriptions 2025", accuracy: "94%", status: "Actif", desc: "Modèle prophète basé sur la démographie du BAC." },
              { title: "Détection Anamalies Budgétaires", accuracy: "98%", status: "Actif", desc: "Analyse en temps réel de 10k+ lignes de dépenses." },
              { title: "Score Employabilité Master", accuracy: "86%", status: "Entraînement", desc: "Correlation avec les offres de stages." },
            ].map((m, i) => (
              <div key={i} className="p-4 border border-border bg-card rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm">{m.title}</div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium",
                    m.status === "Actif" ? "bg-success/10 text-success border-success/30" : "bg-info/10 text-info border-info/30")}>
                    {m.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-3">{m.desc}</div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Précision du Modèle</span>
                  <span className="font-bold text-navy">{m.accuracy}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
