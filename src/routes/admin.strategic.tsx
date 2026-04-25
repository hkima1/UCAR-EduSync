import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Map, Lightbulb } from "lucide-react";

export const Route = createFileRoute("/admin/strategic")({
  head: () => ({ meta: [{ title: "Analyse stratégique — Admin. Établissement" }] }),
  component: AdminStrategic,
});

const ADMISSION_DATA = [
  { year: "2020", candidats: 2100, admis: 450 },
  { year: "2021", candidats: 2350, admis: 460 },
  { year: "2022", candidats: 2500, admis: 480 },
  { year: "2023", candidats: 2800, admis: 510 },
  { year: "2024", candidats: 3100, admis: 520 },
];

function AdminStrategic() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin. · INSAT" title="Analyse Stratégique" description="Outils d'aide à la décision : prédictions d'admission, évolutions de capacité." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Attractivité (Candidats vs Admis)" description="Évolution sur 5 ans">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ADMISSION_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--info)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAdmis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                <Area type="monotone" dataKey="candidats" stroke="var(--info)" fillOpacity={1} fill="url(#colorCand)" name="Candidats" />
                <Area type="monotone" dataKey="admis" stroke="var(--success)" fillOpacity={1} fill="url(#colorAdmis)" name="Admis" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Recommandation IA" description="Projections pour 2025" actions={<Lightbulb className="size-5 text-gold" />}>
          <div className="space-y-4">
            <p className="text-sm bg-gold/5 border border-gold/30 p-4 rounded-xl leading-relaxed">
              Basé sur la tendance d'augmentation des candidatures (+10% an) et la saturation des locaux actuels (92% de taux d'occupation académique), l'IA préconise :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm ml-2 marker:text-gold text-muted-foreground">
              <li>Mise en place d'un système hybride pour les amphis avec forte affluence.</li>
              <li>Création d'une nouvelle filière de « Data Science » (demande du marché ++).</li>
              <li>Renouvellement d'infrastructure pour l'aile Est (Déficit budgétaire potentiel).</li>
            </ul>
          </div>
        </Section>
      </div>
    </div>
  );
}
