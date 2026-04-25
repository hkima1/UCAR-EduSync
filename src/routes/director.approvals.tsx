import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { leaveRequests } from "@/mock/staff";
import { spendRequests } from "@/mock/financials";
import { CheckCircle2, XCircle, Clock, FileText, Wallet, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/approvals")({
  head: () => ({ meta: [{ title: "File d'approbation — Directeur" }] }),
  component: DirectorApprovals,
});

function DirectorApprovals() {
  const [activeTab, setActiveTab] = useState<"all" | "finance" | "hr">("all");
  
  const hrPending = leaveRequests.filter(r => r.status === "En attente").map(r => ({
    id: `hr-${r.id}`, type: "hr", title: "Congé: " + r.type, from: r.staffName,
    date: r.startDate, amount: null, urgency: "normal", status: "pending", desc: `${r.days} jours demandés.`
  }));
  
  const finPending = spendRequests.filter(r => r.status === "pending").map(r => ({
    id: `fin-${r.id}`, type: "finance", title: r.reason, from: r.department,
    date: r.date, amount: r.amount, urgency: r.urgency, status: "pending", desc: `Auteur: ${r.submittedBy}`
  }));

  const allRequests = [...hrPending, ...finPending].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayed = allRequests.filter(r => activeTab === "all" || r.type === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Directeur · INSAT" title="File d'approbation Dirigeant" description="Validation finale des requêtes financières et administratives." />

      <div className="flex gap-2 bg-muted/50 p-1 w-fit rounded-lg">
        {[
          { id: "all", label: "Toutes les demandes", count: allRequests.length },
          { id: "finance", label: "Finances & Achats", count: finPending.length },
          { id: "hr", label: "Congés & RH", count: hrPending.length },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={cn("px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
              activeTab === t.id ? "bg-card shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            <span className="text-[10px] bg-muted-foreground/20 px-2 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      <Section title="Demandes en attente" description={`${displayed.length} éléments requièrent votre validation`}>
        <div className="space-y-3">
          {displayed.map((req) => (
            <div key={req.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-4 hover:border-gold/30 transition-all">
              <div className={cn("size-12 rounded-xl flex items-center justify-center shrink-0 border",
                req.type === "finance" ? "bg-warning/10 border-warning/20 text-warning" : "bg-info/10 border-info/20 text-info")}>
                {req.type === "finance" ? <Wallet className="size-5" /> : <Calendar className="size-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">{req.title}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">{req.from} · {new Date(req.date).toLocaleDateString("fr-FR")}</div>
                  </div>
                  {req.amount && <div className="font-bold text-sm">{req.amount.toLocaleString("fr-FR")} DT</div>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{req.desc}</p>
                {req.urgency === "urgent" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 uppercase tracking-wider font-bold mt-2 inline-block">Urgent</span>}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button size="sm" className="gap-2 bg-success hover:bg-success/90 text-white"><CheckCircle2 className="size-4" /> Approuver</Button>
                <Button size="sm" variant="outline" className="gap-2 text-destructive hover:bg-destructive/10"><XCircle className="size-4" /> Rejeter</Button>
              </div>
            </div>
          ))}
          {displayed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">Aucune demande en attente dans cette catégorie.</div>
          )}
        </div>
      </Section>
    </div>
  );
}
