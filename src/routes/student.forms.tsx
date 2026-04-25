import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { MessageSquare, Star, AlertCircle, Briefcase, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/forms")({
  head: () => ({ meta: [{ title: "Formulaires — UCAR Étudiant" }] }),
  component: StudentForms,
});

const FORMS = [
  { id: "feedback", icon: Star, label: "Évaluation de cours", desc: "Notez votre enseignant sur 5 dimensions pédagogiques.", color: "gold", agent: "notify_agent" as const },
  { id: "event", icon: MessageSquare, label: "Avis événement", desc: "Partagez votre retour sur un événement campus.", color: "info", agent: "notify_agent" as const },
  { id: "complaint", icon: AlertCircle, label: "Réclamation / Suggestion", desc: "Signalez un problème ou proposez une amélioration.", color: "warning", agent: "workflow_agent" as const },
  { id: "internship-decl", icon: Briefcase, label: "Déclaration de stage", desc: "Déclarez votre stage en entreprise auprès de l'administration.", color: "success", agent: "workflow_agent" as const },
];

const COURSES = ["Algorithmique avancée", "Bases de données", "Réseaux", "Génie logiciel", "Anglais technique"];
const DIMENSIONS = ["Clarté des explications", "Qualité du contenu", "Disponibilité", "Équité de l'évaluation", "Satisfaction globale"];

function StudentForms() {
  const [active, setActive] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const { submitTask } = useAgentTask();

  const handleSubmit = async (formId: string, agentType: "notify_agent" | "workflow_agent") => {
    await submitTask({ type: agentType, description: `Formulaire soumis : ${FORMS.find(f => f.id === formId)?.label}`, payload: { formId, ratings, text }, targetRole: "teacher" });
    setSubmitted((prev) => [...prev, formId]);
    setActive(null);
    setRatings({});
    setText("");
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Étudiant · ENIT" title="Centre de formulaires" description="Évaluations, réclamations et déclarations — tout en un seul endroit." />

      <div className="grid gap-4 sm:grid-cols-2">
        {FORMS.map((form) => {
          const Icon = form.icon;
          const isDone = submitted.includes(form.id);
          const isActive = active === form.id;
          const colorMap: Record<string, string> = {
            gold: "bg-gold/10 border-gold/20 text-gold",
            info: "bg-info/10 border-info/20 text-info",
            warning: "bg-warning/10 border-warning/20 text-warning",
            success: "bg-success/10 border-success/20 text-success",
          };
          return (
            <div key={form.id} className={cn("rounded-2xl border bg-card transition-all", isActive ? "border-gold/40 shadow-lg shadow-gold/5" : "border-border hover:border-muted-foreground/30")}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className={cn("size-11 rounded-xl border flex items-center justify-center shrink-0", colorMap[form.color])}>
                    <Icon className="size-5" />
                  </div>
                  {isDone && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 font-medium uppercase tracking-wider"><CheckCircle2 className="size-3" />Soumis</span>}
                </div>
                <div className="mt-4 font-display font-semibold">{form.label}</div>
                <p className="mt-1 text-sm text-muted-foreground">{form.desc}</p>
                {!isDone && (
                  <Button size="sm" variant="outline" className="mt-4 w-full" onClick={() => setActive(isActive ? null : form.id)}>
                    {isActive ? "Fermer" : "Remplir le formulaire"}
                  </Button>
                )}
              </div>

              {isActive && (
                <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
                  {form.id === "feedback" && (
                    <>
                      <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold">
                        <option value="">Sélectionner le cours…</option>
                        {COURSES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <div className="space-y-3">
                        {DIMENSIONS.map((dim) => (
                          <div key={dim}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground">{dim}</span>
                              <span className="font-semibold text-gold">{ratings[dim] ?? "—"}/5</span>
                            </div>
                            <div className="flex gap-1.5">
                              {[1,2,3,4,5].map((v) => (
                                <button key={v} onClick={() => setRatings(r => ({...r, [dim]: v}))}
                                  className={cn("flex-1 h-7 rounded-md border text-xs font-bold transition-colors",
                                    ratings[dim] === v ? "border-gold bg-gold/20 text-gold" : "border-border hover:border-gold/40 text-muted-foreground")}>
                                  {v}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {form.id === "event" && (
                    <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold">
                      <option>Journée IA & Innovation — INSAT</option>
                      <option>Workshop Design Thinking — ENIT</option>
                    </select>
                  )}
                  {form.id === "complaint" && (
                    <select className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold">
                      <option>Problème administratif</option>
                      <option>Infrastructure / Matériel</option>
                      <option>Pédagogie</option>
                      <option>Suggestion d'amélioration</option>
                    </select>
                  )}
                  {form.id === "internship-decl" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input placeholder="Entreprise" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
                      <input placeholder="Superviseur" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
                      <input placeholder="Date début" type="date" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
                      <input placeholder="Date fin" type="date" className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
                    </div>
                  )}
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
                    placeholder="Commentaires libres (facultatif)…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
                  <Button className="w-full gap-2" onClick={() => handleSubmit(form.id, form.agent)}>
                    <Send className="size-4" /> Soumettre
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
