import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { currentStudent, gpaTrend } from "@/mock/students";
import { Sparkles, BookOpen, CheckCircle2, Clock, Circle, Award, ChevronRight, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useAcademicAdvisorAPI } from "@/hooks/useAcademicAdvisorAPI";
import { useUIStore } from "@/stores/uiStore";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/student/educational-path")({
  head: () => ({ meta: [{ title: "Parcours académique — UCAR Étudiant" }] }),
  component: StudentEducationalPath,
});

const CERTIFICATIONS = [
  { title: "AWS Cloud Practitioner", org: "Amazon Web Services", level: "Fondamental", match: 92, desc: "Idéal pour compléter votre parcours cloud. Certif reconnue mondialement." },
  { title: "Google Data Analytics", org: "Google / Coursera", level: "Intermédiaire", match: 88, desc: "Valorise vos compétences en algorithmique et bases de données." },
  { title: "CISCO CCNA", org: "Cisco Networking Academy", level: "Intermédiaire", match: 79, desc: "Réseaux avancés — complémentaire à votre cours INF303." },
  { title: "Azure AI Fundamentals", org: "Microsoft Learn", level: "Fondamental", match: 75, desc: "Introduction à l'IA appliquée sur infrastructure cloud." },
];

function StudentEducationalPath() {
  const { submitTask } = useAgentTask();
  const { adviseAsMarkdown } = useAcademicAdvisorAPI();
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
      description: "Conseils de parcours et certifications (Academic Advisor Agent)",
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Étudiant · ENIT"
        title="Parcours académique"
        description="Visualisez votre progression semestrielle, vos objectifs de diplôme et les certifications recommandées par l'IA."
        actions={
          <Button onClick={handleAdvisorTask} disabled={advisorLoading} className="gap-2">
            {advisorLoading ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
            Tâche Agent: Conseiller académique
          </Button>
        }
      />

      {(advisorOutput || advisorError) && (
        <Section
          title="Sortie de l'Academic Advisor Agent"
          description="Conseils personnalisés récupérés via l'API Python"
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

      {/* Semester stepper */}
      <Section title="Progression académique" description={`Génie Informatique · ${currentStudent.totalCredits} crédits pour le diplôme`}>
        <div className="space-y-3">
          {gpaTrend.map((sem, i) => {
            const isCurrent = i === gpaTrend.length - 1;
            const isFuture = false;
            return (
              <div key={i} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all",
                isCurrent ? "border-gold/40 bg-gold/5" : "border-border hover:border-muted-foreground/20")}>
                <div className={cn("size-10 rounded-xl border-2 flex items-center justify-center shrink-0 font-display font-bold text-sm",
                  isCurrent ? "border-gold bg-gold text-white" : "border-success/50 bg-success/10 text-success")}>
                  {isCurrent ? <Clock className="size-5" /> : <CheckCircle2 className="size-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{sem.semester}</span>
                    {isCurrent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-medium uppercase tracking-wider">En cours</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Moyenne : <span className="font-semibold text-foreground">{sem.gpa}/20</span></div>
                </div>
                <div className="text-right shrink-0">
                  <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold/60" style={{ width: `${(sem.gpa / 20) * 100}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{Math.round((sem.gpa / 20) * 100)}%</div>
                </div>
              </div>
            );
          })}
          {/* Future semesters */}
          {["S6", "S7", "S8"].map((sem, i) => (
            <div key={sem} className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border opacity-50">
              <div className="size-10 rounded-xl border-2 border-border bg-muted flex items-center justify-center shrink-0">
                <Circle className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-muted-foreground">{sem}</div>
                <div className="text-xs text-muted-foreground mt-0.5">À venir</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Crédits obtenus", val: `${currentStudent.credits}` },
            { label: "Crédits restants", val: `${currentStudent.totalCredits - currentStudent.credits}` },
            { label: "Date diplôme prévisionnelle", val: "Juin 2027" },
            { label: "Mention estimée", val: "Bien" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-muted/30 border border-border p-4 text-center">
              <div className="font-display font-bold text-xl">{item.val}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* AI Certifications */}
      <Section
        title="Certifications recommandées par l'IA"
        description="Sélectionnées selon votre profil académique et vos cours actuels"
        actions={<Sparkles className="size-4 text-gold" />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {CERTIFICATIONS.map((c, i) => (
            <div key={i} className="group rounded-xl border border-border hover:border-gold/40 bg-card p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-gold/5">
              <div className="flex items-center justify-between gap-2">
                <div className="size-10 shrink-0 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center">
                  <Award className="size-5 text-navy" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-gold">{c.match}% match</span>
                  <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${c.match}%` }} />
                  </div>
                </div>
              </div>
              <div>
                <div className="font-display font-semibold">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.org} · {c.level}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              <div className="flex gap-2 mt-auto">
                <Button size="sm" className="flex-1 gap-1.5"><BookOpen className="size-3.5" />S'inscrire</Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1.5"><ChevronRight className="size-3.5" />Plus d'infos</Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
