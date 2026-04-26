import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import {
  currentStudent,
  studentGrades,
  upcomingExams,
  studentAbsences,
  gpaTrend,
} from "@/mock/students";
import { getInstitution } from "@/mock/institutions";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Calendar, FileText, MessagesSquare, Sparkles, BookOpen, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useAcademicAdvisorAPI } from "@/hooks/useAcademicAdvisorAPI";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — UCAR Étudiant" },
      { name: "description", content: "Tableau de bord étudiant : notes, présence, examens et démarches en cours." },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const openCopilot = useUIStore((s) => s.openCopilot);
  const openAgents = useUIStore((s) => s.openAgents);
  const { submitTask } = useAgentTask();
  const { adviseAsMarkdown } = useAcademicAdvisorAPI();
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorOutput, setAdvisorOutput] = useState<string>("");

  const handleAdvisorTask = async () => {
    setAdvisorLoading(true);
    setAdvisorError(null);
    openAgents();

    await submitTask({
      type: "analytics_agent",
      description: "Conseil académique personnalisé (Academic Advisor Agent)",
      payload: { source: "academic_advisor_agent", studentId: currentStudent.id },
      externalRun: async () => {
        try {
          const output = await adviseAsMarkdown(currentStudent.id);
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

  if (!user) return null;
  const institution = getInstitution(currentStudent.institutionId);
  const recentGrades = studentGrades.slice(0, 5);
  const unjustified = studentAbsences.filter((a) => a.status === "Non justifiée").length;

  return (
    <div className="space-y-6">
      {/* Welcome / hero */}
      <div className="relative overflow-hidden rounded-xl ucar-gradient-navy text-white p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute inset-0 ucar-grid-bg opacity-20" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80 font-medium">
              Semestre {currentStudent.semester} · {currentStudent.field}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
              Bienvenue, {user.name.split(" ")[0]}.
            </h1>
            <p className="text-white/70 mt-2 max-w-xl text-sm">
              {institution.name} · Voici votre situation académique en un coup d'œil.
            </p>
          </div>
          <Button
            onClick={openCopilot}
            className="bg-gold text-navy hover:bg-gold/90 font-medium"
          >
            <Sparkles className="size-4 mr-2" />
            Demander à l'IA
          </Button>
          <Button
            onClick={handleAdvisorTask}
            disabled={advisorLoading}
            className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-medium"
          >
            {advisorLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Bot className="size-4 mr-2" />}
            Tâche Agent: Conseiller académique
          </Button>
        </div>
      </div>

      {(advisorOutput || advisorError) && (
        <Section
          title="Sortie de l'Academic Advisor Agent"
          description="Résultat récupéré via l'API de l'agent académique"
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

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Moyenne générale"
          value={currentStudent.gpa.toFixed(2)}
          hint="sur 20 — Semestre en cours"
          delta="+0.3"
          trend="up"
          accent="gold"
        />
        <StatCard
          label="Présence"
          value={`${currentStudent.attendanceRate}%`}
          hint="Seuil critique : 75%"
          delta="-2pt"
          trend="down"
          accent="navy"
        />
        <StatCard
          label="Examens à venir"
          value={upcomingExams.length}
          hint="Dans les 14 prochains jours"
          accent="warning"
        />
        <StatCard
          label="Tâches en attente"
          value={unjustified + 1}
          hint={`${unjustified} absence(s) à justifier`}
          accent="destructive"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend */}
        <Section title="Évolution de la moyenne" description="Sur les 5 derniers semestres" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="semester" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis domain={[10, 18]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine y={10} stroke="var(--destructive)" strokeDasharray="4 4" label={{ value: "Min validation", position: "right", fontSize: 10, fill: "var(--destructive)" }} />
                <Line
                  type="monotone"
                  dataKey="gpa"
                  stroke="var(--gold)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--gold)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        {/* Upcoming exams */}
        <Section title="Examens à venir">
          <ul className="divide-y divide-border -m-5">
            {upcomingExams.map((e, i) => (
              <li key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="size-10 rounded-md bg-navy/5 flex flex-col items-center justify-center text-navy">
                  <span className="text-[9px] uppercase font-bold leading-none">
                    {new Date(e.date).toLocaleString("fr-FR", { month: "short" })}
                  </span>
                  <span className="text-sm font-display font-bold leading-none">
                    {new Date(e.date).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{e.course}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.time} · {e.room}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent grades */}
        <Section
          title="Notes récentes"
          actions={
            <Link to="/student/grades" className="text-xs text-gold hover:underline">
              Tout voir →
            </Link>
          }
          className="lg:col-span-2"
        >
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-5 py-3">Cours</th>
                  <th className="text-left font-medium px-5 py-3">Code</th>
                  <th className="text-right font-medium px-5 py-3">Crédits</th>
                  <th className="text-right font-medium px-5 py-3">Note</th>
                  <th className="text-right font-medium px-5 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentGrades.map((g, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{g.course}</td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{g.code}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{g.credits}</td>
                    <td className="px-5 py-3 text-right font-display font-semibold">
                      {g.grade.toFixed(1)}
                      <span className="text-muted-foreground text-xs">/{g.max}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={
                          g.grade >= 10
                            ? "inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium bg-success/10 text-success border border-success/30"
                            : "inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium bg-destructive/10 text-destructive border border-destructive/30"
                        }
                      >
                        {g.grade >= 10 ? "Validé" : "Échec"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Quick actions */}
        <Section title="Actions rapides">
          <div className="space-y-2">
            <Link
              to="/student/documents"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-gold/60 hover:bg-muted/40 transition-colors"
            >
              <div className="size-9 rounded-md bg-gold/10 text-gold flex items-center justify-center">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">Demander un document</div>
                <div className="text-xs text-muted-foreground">Attestation, relevé…</div>
              </div>
            </Link>
            <Link
              to="/student/forms"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-gold/60 hover:bg-muted/40 transition-colors"
            >
              <div className="size-9 rounded-md bg-info/10 text-info flex items-center justify-center">
                <MessagesSquare className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">Soumettre un retour</div>
                <div className="text-xs text-muted-foreground">Feedback / réclamation</div>
              </div>
            </Link>
            <Link
              to="/student/schedule"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-gold/60 hover:bg-muted/40 transition-colors"
            >
              <div className="size-9 rounded-md bg-success/10 text-success flex items-center justify-center">
                <Calendar className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">Voir l'emploi du temps</div>
                <div className="text-xs text-muted-foreground">Semaine en cours</div>
              </div>
            </Link>
            <Link
              to="/student/grades"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-gold/60 hover:bg-muted/40 transition-colors"
            >
              <div className="size-9 rounded-md bg-navy/10 text-navy flex items-center justify-center">
                <BookOpen className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">Mes résultats détaillés</div>
                <div className="text-xs text-muted-foreground">Toutes les matières</div>
              </div>
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}
