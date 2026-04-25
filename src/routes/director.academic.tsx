import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { BookOpen, Award, TrendingUp, Users } from "lucide-react";
import { courses } from "@/mock/courses";

export const Route = createFileRoute("/director/academic")({
  head: () => ({ meta: [{ title: "Suivi Académique — Directeur" }] }),
  component: DirectorAcademic,
});

const PERF_DATA = [
  { dept: "Génie Logiciel", avg: 13.5, passRate: 85 },
  { dept: "Réseaux & Télécoms", avg: 12.8, passRate: 78 },
  { dept: "Inf. Industrielle", avg: 14.1, passRate: 92 },
  { dept: "Math. Appliquées", avg: 11.5, passRate: 65 },
];

function DirectorAcademic() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Directeur · INSAT" title="Performances Académiques" description="Analyse des résultats, taux de diplomation et indicateurs pédagogiques détaillés." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Moyenne Établissement" value="13.1/20" hint="Semestre 5" trend="up" delta="+0.4" accent="navy" />
        <StatCard label="Taux de réussite" value="81%" hint="Global" accent="success" />
        <StatCard label="Assiduité moyenne" value="88%" hint="Tous départements" accent="gold" />
        <StatCard label="Modules critiques" value="3" hint="Moy. < 10/20" accent="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Moyennes par Département" description="Comparaison des notes générales">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERF_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 20]} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                <Bar dataKey="avg" fill="var(--gold)" radius={[4, 4, 0, 0]} name="Moyenne" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Programmes et Modules" description="État d'avancement des cours">
          <div className="space-y-3">
            {courses.slice(0, 5).map((c) => (
              <div key={c.id} className="p-3 border border-border rounded-lg bg-card flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.department} · {c.credits} crédits</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{c.avgGrade}/20</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{c.studentCount} inscrits</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
