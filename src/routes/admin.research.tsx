import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { researchProjects, publications } from "@/mock/research";
import { FlaskConical, BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/research")({
  head: () => ({ meta: [{ title: "Recherche — Admin. Établissement" }] }),
  component: AdminResearch,
});

function AdminResearch() {
  const activeProjects = researchProjects.filter(p => p.status === "active");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin. · INSAT" title="Recherche & Innovation" description="Suivi des projets de recherche, publications et financements (Subventions)." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Projets Actifs" description={`${activeProjects.length} projets en cours d'exécution`}>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {activeProjects.map((p) => (
              <div key={p.id} className="p-4 border border-border rounded-xl bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-sm">{p.title}</div>
                  <div className="font-bold text-sm text-gold">{p.budget.toLocaleString("fr-FR")} DT</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <FlaskConical className="size-3" /> {p.principalInvestigator}
                  <span className="mx-1">•</span>
                  <Clock className="size-3" /> Fin: {new Date(p.endDate).toLocaleDateString("fr-FR")}
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-success" style={{ width: `${p.completionRate}%` }} />
                </div>
                <div className="text-right text-[10px] text-muted-foreground mt-1">{p.completionRate}% achevé</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Dernières Publications" description="Articles acceptés et récents">
          <div className="space-y-3">
            {publications.slice(0, 5).map((pub) => (
              <div key={pub.id} className="flex gap-3 p-3 border border-border rounded-lg bg-card items-center">
                <BookOpen className="size-5 text-navy shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{pub.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{pub.authors.join(", ")}</div>
                  <div className="text-[10px] uppercase text-muted-foreground mt-1">{pub.journal} ({pub.year})</div>
                </div>
                <CheckCircle2 className="size-4 text-success shrink-0" />
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
