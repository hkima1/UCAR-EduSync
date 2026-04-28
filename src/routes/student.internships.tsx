import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { offers, scholarships } from "@/mock/offers";
import { Briefcase, GraduationCap, MapPin, Clock, CalendarDays, Award, Sparkles, ExternalLink, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useScholarshipAdvisorAPI, formatScholarshipMarkdown } from "@/hooks/useScholarshipAdvisorAPI";
import { useUIStore } from "@/stores/uiStore";
import ReactMarkdown from "react-markdown";
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

const COMPANY_URLS: Record<string, string> = {
  "Tunisie Telecom": "https://www.tunisietelecom.tn",
  "Banque de l'Habitat": "https://www.bhbank.tn",
  "STB": "https://www.stb.com.tn",
  "Sofrecom Tunisie": "https://www.sofrecom.com",
  "Vermeg": "https://www.vermeg.com",
  "Poulina Group": "https://www.poulina.com.tn",
  "ATB": "https://www.atb.com.tn",
  "Telnet Holding": "https://www.telnetholding.com",
  "OneTech BSI": "https://www.onetech-group.com",
  "Délice Holding": "https://www.delice.tn"
};

function StudentInternships() {
  const [tab, setTab] = useState<"internships" | "scholarships">("internships");
  const [applying, setApplying] = useState<string | null>(null);
  const { submitTask } = useAgentTask();
  
  const { adviseAsMarkdown } = useScholarshipAdvisorAPI();
  const openAgents = useUIStore((s) => s.openAgents);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorOutput, setAdvisorOutput] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleApply = async (id: string, title: string, company: string) => {
    setApplying(id);
    await submitTask({ type: "workflow_agent", description: `Candidature — ${title}`, payload: { offerId: id, studentId: "A-002" }, targetRole: "institution_admin" });
    setApplying(null);
    const url = COMPANY_URLS[company];
    if (url) {
      window.open(url, "_blank");
    }
  };

  const handleAdvisorTask = async () => {
    setAdvisorLoading(true);
    setAdvisorError(null);
    openAgents();

    await submitTask({
      type: "analytics_agent",
      description: "Recherche de bourses et stages (Scholarship Agent)",
      payload: { source: "scholarship_agent", studentId: "A-002" },
      externalRun: async () => {
        try {
          const { advise } = useScholarshipAdvisorAPI();
          const data = await advise("A-002");
          setDownloadUrl(data.download_url as string | null);
          const output = formatScholarshipMarkdown(data);
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
        title="Stages & Bourses" 
        description="Offres matchées à votre profil par l'IA. Postulez en un clic — l'agent notifie le partenariat." 
        actions={
          <Button onClick={handleAdvisorTask} disabled={advisorLoading} className="gap-2">
            {advisorLoading ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
            Tâche Agent: Bourses & Stages
          </Button>
        }
      />

      {(advisorOutput || advisorError) && (
        <Section
          title="Sortie du Scholarship Agent"
          description="Recommandations récupérées via l'API Python"
        >
          {advisorError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {advisorError}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none rounded-lg border border-border bg-muted/30 p-4">
                <ReactMarkdown>{advisorOutput}</ReactMarkdown>
              </div>
              {downloadUrl && (
                <Button 
                  onClick={() => window.open(downloadUrl, "_blank")}
                  className="w-full bg-gold hover:bg-gold/90 text-navy gap-2 shadow-xl"
                  size="lg"
                >
                  <Bot className="size-5" />
                  TÉLÉCHARGER LE RAPPORT PDF
                </Button>
              )}
            </div>
          )}
        </Section>
      )}

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
              <Button size="sm" className="mt-auto w-full gap-2" disabled={applying === o.id} onClick={() => handleApply(o.id, o.title, o.company)}>
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
