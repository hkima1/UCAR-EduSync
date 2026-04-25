import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Scale, Users, Target, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/superadmin/employment-equity")({
  head: () => ({ meta: [{ title: "Équité & Parité — UCAR" }] }),
  component: SuperAdminEquity,
});

const PARITY_DATA = [
  { role: "Professeurs", F: 42, M: 58 },
  { role: "HDR", F: 45, M: 55 },
  { role: "Adjoints", F: 60, M: 40 },
  { role: "Administration", F: 65, M: 35 },
];

function SuperAdminEquity() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Super Admin · UCAR" title="Équité d'Emploi & Diversité" description="Observatoire national de la parité et de la diversité au sein des ressources humaines universitaires." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Parité par grade (Femmes / Hommes %)" description="Données consolidées 2024">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PARITY_DATA} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="role" type="category" stroke="var(--muted-foreground)" fontSize={11} width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                <Bar dataKey="F" stackId="a" fill="var(--gold)" name="Femmes" radius={[4, 0, 0, 4]} />
                <Bar dataKey="M" stackId="a" fill="var(--navy)" name="Hommes" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-4 justify-center">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold" />Femmes</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy" />Hommes</span>
          </div>
        </Section>

        <Section title="Priorités RH & Inclusion">
          <div className="space-y-3">
            {[
              { title: "Objectif 50% Postes de Direction", progress: 42, target: 50 },
              { title: "Inclusion Handicap (Loi emploi)", progress: 4.5, target: 6 },
              { title: "Jeunes chercheurs de moins de 35 ans", progress: 28, target: 30 },
            ].map((p, i) => (
              <div key={i} className="p-4 border border-border bg-card rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">{p.title}</span>
                  <span className="text-muted-foreground">{p.progress}% / {p.target}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-success" style={{ width: `${(p.progress / p.target) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center p-4 bg-muted/30 rounded-xl border border-dashed border-border gap-3 text-sm">
            <Target className="size-5 text-gold" /> 
            Prochain audit gouvernemental : 15 Mars 2025
          </div>
        </Section>
      </div>
    </div>
  );
}
