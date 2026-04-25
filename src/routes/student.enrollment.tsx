import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { currentStudent } from "@/mock/students";
import { CheckCircle2, Clock, AlertCircle, CreditCard, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/enrollment")({
  head: () => ({ meta: [{ title: "Inscription — UCAR Étudiant" }] }),
  component: StudentEnrollment,
});

const STEPS = [
  { label: "Soumission", desc: "Dossier déposé en ligne", done: true },
  { label: "Examen du dossier", desc: "Vérification administrative", done: true },
  { label: "Validation pédagogique", desc: "Accord du responsable filière", done: true },
  { label: "Confirmation", desc: "Acquittement frais de scolarité", done: true },
  { label: "Inscription complète", desc: "Carte étudiant émise", done: false },
] as const;

const COURSES_NEXT = [
  { code: "INF401", name: "Intelligence Artificielle", credits: 6, required: true },
  { code: "INF402", name: "Cloud Computing", credits: 5, required: true },
  { code: "INF403", name: "Big Data & Analytics", credits: 4, required: false },
  { code: "INF404", name: "Blockchain & Web3", credits: 4, required: false },
  { code: "MAT401", name: "Statistiques avancées", credits: 3, required: true },
  { code: "LAN401", name: "Communication professionnelle", credits: 2, required: true },
];

function StudentEnrollment() {
  const currentStep = STEPS.findIndex((s) => !s.done);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Étudiant · ENIT" title="Inscription & Réinscription" description="Statut de votre inscription, sélection des cours du prochain semestre et paiement." />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Semestre actuel" value="S5" hint="Génie Informatique" accent="navy" />
        <StatCard label="Crédits validés" value={currentStudent.credits} hint={`sur ${currentStudent.totalCredits}`} accent="success" />
        <StatCard label="Statut paiement" value="Payé" hint="Reçu #2024-1182" accent="gold" />
        <StatCard label="Prochain semestre" value="S6" hint="Début : Fév 2025" accent="info" />
      </div>

      {/* Status stepper */}
      <Section title="Statut d'inscription" description="Progression du dossier administratif">
        <div className="relative">
          <div className="flex items-start gap-0">
            {STEPS.map((step, i) => {
              const isActive = i === currentStep;
              const isDone = step.done;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div className={cn("absolute top-5 left-1/2 w-full h-0.5 z-0", isDone ? "bg-gold" : "bg-border")} />
                  )}
                  {/* Circle */}
                  <div className={cn(
                    "relative z-10 size-10 rounded-full border-2 flex items-center justify-center transition-all mb-3",
                    isDone ? "border-gold bg-gold text-white" : isActive ? "border-gold bg-background" : "border-border bg-background text-muted-foreground",
                  )}>
                    {isDone ? <CheckCircle2 className="size-5" /> : isActive ? <Clock className="size-5 text-gold animate-pulse" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  {/* Label */}
                  <div className="text-center px-1">
                    <div className={cn("text-xs font-semibold", isDone ? "text-gold" : isActive ? "text-foreground" : "text-muted-foreground")}>{step.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-gold/5 border border-gold/20 flex items-center gap-3">
          <AlertCircle className="size-5 text-gold shrink-0" />
          <div className="text-sm">
            <span className="font-medium">Action requise : </span>
            Récupérez votre carte étudiante au bureau de scolarité (bâtiment A, rez-de-chaussée) avant le 15 janvier 2025.
          </div>
        </div>
      </Section>

      {/* Next semester course selection */}
      <Section title="Sélection des cours — Semestre 6" description="Confirmez vos matières pour le semestre à venir">
        <div className="space-y-2">
          {COURSES_NEXT.map((course) => (
            <div key={course.code} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border hover:border-gold/30 bg-card transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn("size-2 rounded-full shrink-0", course.required ? "bg-gold" : "bg-muted-foreground")} />
                <div>
                  <div className="text-sm font-medium">{course.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{course.code} · {course.credits} crédits</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {course.required ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30 font-medium uppercase tracking-wider">Obligatoire</span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium uppercase tracking-wider">Optionnel</span>
                )}
                <input type="checkbox" defaultChecked={course.required} className="size-4 accent-[oklch(0.78_0.13_85)] cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Total sélectionné : <span className="font-semibold text-foreground">24 crédits</span></div>
          <Button className="gap-2"><BookOpen className="size-4" />Confirmer la sélection</Button>
        </div>
      </Section>

      {/* Payment card */}
      <Section title="Frais de scolarité" description="Situation financière — année 2024–2025">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-5 rounded-xl bg-success/5 border border-success/20 space-y-3">
            <div className="flex items-center gap-2 text-success font-semibold">
              <CheckCircle2 className="size-5" /> Semestre en cours — Payé
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Frais de scolarité S5</span><span className="font-medium text-foreground">450 DT</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Frais d'assurance</span><span className="font-medium text-foreground">30 DT</span></div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-semibold"><span>Total réglé</span><span className="text-success">480 DT</span></div>
            </div>
            <div className="text-xs text-muted-foreground">Reçu #2024-1182 · Payé le 15 sept. 2024</div>
          </div>
          <div className="p-5 rounded-xl bg-muted/30 border border-border space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground font-semibold">
              <CreditCard className="size-5" /> Prochain semestre — En attente
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Frais de scolarité S6</span><span className="font-medium text-foreground">450 DT</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Frais d'assurance</span><span className="font-medium text-foreground">30 DT</span></div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-semibold"><span>Total à régler</span><span>480 DT</span></div>
            </div>
            <div className="text-xs text-muted-foreground">Échéance : 28 février 2025</div>
            <Button variant="outline" size="sm" className="w-full gap-2 border-gold/30 hover:bg-gold/5">
              <CreditCard className="size-4 text-gold" /> Procéder au paiement
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
