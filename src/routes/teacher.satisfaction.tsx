import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { MessageSquareQuote, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/satisfaction")({
  head: () => ({ meta: [{ title: "Satisfaction — UCAR Enseignant" }] }),
  component: TeacherSatisfaction,
});

const RADAR_DATA = [
  { subject: "Clarté", A: 4.5, fullMark: 5 },
  { subject: "Disponibilité", A: 3.8, fullMark: 5 },
  { subject: "Rythme", A: 4.1, fullMark: 5 },
  { subject: "Supports", A: 4.8, fullMark: 5 },
  { subject: "Évaluation", A: 3.9, fullMark: 5 },
];

const FEEDBACKS = [
  { text: "Cours très intéressant, mais parfois le rythme est un peu trop rapide.", course: "Algorithmique", sentiment: "neutral" },
  { text: "Les supports de TP sont excellents et les explications claires.", course: "Bases de données", sentiment: "positive" },
  { text: "Difficile de poser des questions en fin de séance par manque de temps.", course: "Algorithmique", sentiment: "negative" },
  { text: "Professeur à l'écoute et très compétent.", course: "Bases de données", sentiment: "positive" },
];

function TeacherSatisfaction() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Enseignant · ENIT" title="Satisfaction Étudiante" description="Retours anonymisés et évaluation pédagogique." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Profil Pédagogique" description="Moyenne globale des évaluations">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Radar name="Résultats" dataKey="A" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Derniers Commentaires" description="Sélection des retours récents (anonymes)">
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {FEEDBACKS.map((f, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("size-2 rounded-full",
                    f.sentiment === "positive" ? "bg-success" : f.sentiment === "negative" ? "bg-destructive" : "bg-warning"
                  )} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{f.course}</span>
                </div>
                <p className="text-sm italic">"{f.text}"</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
