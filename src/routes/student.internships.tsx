import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { offers, scholarships } from "@/mock/offers";
import { Briefcase, GraduationCap, MapPin, Clock, CalendarDays, Award, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/internships")({
  head: () => ({ meta: [{ title: "Stages & Bourses — UCAR" }] }),
  component: StudentInternships,
});

const DOMAIN_COLOR: Record<string, string> = {
  Informatique: "bg-info/10 text-info border-info/30",
  Finance: "bg-gold/10 text-gold border-gold/30",
  Logistique: "bg-warning/10 text-warning border-warning/30",
  Systèmes: "bg-navy/10 text-navy border-navy/30",
  Électronique: "bg-success/10 text-success border-success/30",
  Marketing: "bg-destructive/10 text-destructive border-destructive/30",
};

function StudentInternships() {
  const [tab, setTab] = useState<"internships" | "scholarships">("internships");
  const [applying, setApplying] = useState<string | null>(null);
  const { submitTask } = useAgentTask();

  const handleApply = async (id: string, title: string) => {
    setApplying(id);
    await submitTask({ type: "workflow_agent", description: `Candidature — ${title}`, payload: { offerId: id, studentId: "s1" }, targetRole: "institution_admin" });
    setApplying(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Étudiant · ENIT" title="Stages & Bourses" description="Offres matchées à votre profil par l'IA. Postulez en un clic — l'agent notifie le partenariat." />

      {/* AI banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 via-background to-background px-6 py-5">
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="size-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0">
            <Sparkles className="size-5 text-gold" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm">Recommandations IA — Top 3 matchs</div>
            <p className="text-xs text-muted-foreground mt-0.5">Basé sur votre profil : Génie Informatique, Moy. 14.2/20, S5, Tunis</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { company: "Sofrecom Tunisie", title: "Data Engineer Junior", match: 94, reason: "Parfait match filière + localisation" },
            { company: "Tunisie Telecom", title: "Stage dev web full-stack", match: 88, reason: "Compétences web alignées" },
            { company: "OneTech BSI", title: "Cloud Engineer Intern", match: 81, reason: "Profil cloud & DevOps valorisé" },
          ].map((r, i) => (
            <div key={i} className="rounded-xl border border-gold/20 bg-background/80 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{r.company}</span>
                <span className="text-xs font-bold text-gold">{r.match}%</span>
              </div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.reason}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {(["internships", "scholarships"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
              tab === t ? "bg-card shadow-sm border border-border text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {t === "internships" ? <Briefcase className="size-3.5" /> : <GraduationCap className="size-3.5" />}
            {t === "internships" ? "Stages" : "Bourses"}
          </button>
        ))}
      </div>

      {tab === "internships" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => (
            <article key={o.id} className="group rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="size-11 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground font-mono">
                  {o.company.slice(0, 2).toUpperCase()}
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider", DOMAIN_COLOR[o.domain] ?? "bg-muted text-muted-foreground border-border")}>
                  {o.domain}
                </span>
              </div>
              <div>
                <div className="font-display font-semibold leading-tight">{o.title}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{o.company}</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{o.description}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="size-3" />{o.duration}</span>
                <span className="flex items-center gap-1"><MapPin className="size-3" />{o.location}</span>
                <span className="flex items-center gap-1"><CalendarDays className="size-3" />Limite {new Date(o.deadline).toLocaleDateString("fr-FR")}</span>
              </div>
              <Button size="sm" className="mt-auto w-full gap-2" disabled={applying === o.id} onClick={() => handleApply(o.id, o.title)}>
                {applying === o.id ? "Envoi en cours..." : "Postuler"}
                <ExternalLink className="size-3" />
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {scholarships.map((s) => (
            <article key={s.id} className="group rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-gold/40 hover:shadow-lg transition-all">
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Award className="size-5 text-gold" />
                </div>
                <div>
                  <div className="font-display font-semibold">{s.title}</div>
                  <div className="text-sm text-muted-foreground">{s.sponsor}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Montant</div>
                  <div className="font-semibold text-gold">{s.amount}</div>
                </div>
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Limite</div>
                  <div className="font-semibold">{new Date(s.deadline).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <span className="font-medium text-foreground">Conditions : </span>{s.criteria}
              </div>
              <Button size="sm" variant="outline" className="border-gold/40 hover:bg-gold/5 gap-2">
                <GraduationCap className="size-3.5" /> Demander plus d'infos
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
