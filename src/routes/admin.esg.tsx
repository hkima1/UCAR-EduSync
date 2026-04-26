import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { esgMetrics } from "@/mock/financials";
import { Leaf, Zap, Droplets, Recycle, Bot, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useEnvironmentalAdvisorAPI } from "@/hooks/useEnvironmentalAdvisorAPI";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/admin/esg")({
  head: () => ({ meta: [{ title: "ESG & Dev. Durable — Admin. Établissement" }] }),
  component: AdminESG,
});

const ESG_DATA = [
  { month: "Jan", carbon: 15.2, energy: 320, waste: 45 },
  { month: "Fev", carbon: 14.8, energy: 310, waste: 48 },
  { month: "Mar", carbon: 14.5, energy: 295, waste: 42 },
  { month: "Avr", carbon: 13.9, energy: 280, waste: 40 },
  { month: "Mai", carbon: 14.1, energy: 285, waste: 44 },
];

function AdminESG() {
  const currentEsg = esgMetrics["insat"];
  
  const { submitTask } = useAgentTask();
  const { analyzeAsMarkdown } = useEnvironmentalAdvisorAPI();
  const openAgents = useUIStore((s) => s.openAgents);
  
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorOutput, setAdvisorOutput] = useState<string>("");

  const handleAdvisorTask = async () => {
    setAdvisorLoading(true);
    setAdvisorError(null);
    openAgents();

    await submitTask({
      type: "analytics_agent",
      description: "Conseiller Environnemental (Environmental Advisor Agent)",
      payload: { source: "environmental_advisor_agent", institution: "INSAT" },
      externalRun: async () => {
        try {
          const output = await analyzeAsMarkdown("INSAT");
          setAdvisorOutput(output);
          return output;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur inconnue";
          setAdvisorError(message);
          throw error;
        }
      },
    });

    setAdvisorLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        eyebrow="Admin. · INSAT" 
        title="Rapport Environnemental (ESG)" 
        description="Suivi de la consommation énergétique, empreinte carbone et gestion des déchets." 
        actions={
          <Button
            onClick={handleAdvisorTask}
            disabled={advisorLoading}
            className="bg-success text-success-foreground hover:bg-success/90 font-medium"
          >
            {advisorLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Bot className="size-4 mr-2" />}
            Tâche Agent: Conseiller ESG
          </Button>
        }
      />

      {(advisorOutput || advisorError) && (
        <Section
          title="Stratégie d'Aménagement Vert"
          description="Résultat récupéré via l'Agent Environnemental"
        >
          {advisorError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {advisorError}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/30 p-4">
              <ReactMarkdown>{advisorOutput}</ReactMarkdown>
            </div>
          )}
        </Section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {currentEsg ? (
          <>
            <StatCard label="Empreinte Carbone" value={currentEsg.carbonFootprint} hint="Tonnes CO2/an" accent="destructive" />
            <StatCard label="Consommation Éner." value={currentEsg.energyConsumption} hint="kWh/mois" accent="warning" />
            <StatCard label="Déchets recyclés" value={`${currentEsg.wasteRecycledPercentage}%`} hint="Objectif: 50%" accent="success" />
            <StatCard label="Consommation Eau" value={currentEsg.waterUsage} hint="m³/mois" accent="info" />
          </>
        ) : (
          <div className="col-span-4 p-4 text-center text-muted-foreground">Aucune donnée ESG pour le moment.</div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Réduction Carbone" description="Tendance des derniers mois (tCO2)">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ESG_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                <Bar dataKey="carbon" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="tCO2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
        
        <Section title="Initiatives Vertes" description="Actions en cours">
          <ul className="space-y-4">
            {[
              { icon: Zap, text: "Installation de panneaux solaires sur le toit de l'Amphi A." },
              { icon: Droplets, text: "Réduction du débit des robinets automatiques (-15% de conso)." },
              { icon: Recycle, text: "Tri sélectif obligatoire dans les espaces communs." },
              { icon: Leaf, text: "Digitalisation totale des rapports de stage (zéro papier)." },
            ].map((init, i) => (
              <li key={i} className="flex gap-3 items-center">
                <div className="size-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <init.icon className="size-4 text-success" />
                </div>
                <span className="text-sm font-medium">{init.text}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
