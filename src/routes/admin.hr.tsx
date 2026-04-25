import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { staffMembers, leaveRequests, trainingSessions, recruitmentPositions } from "@/mock/staff";
import { CheckCircle2, XCircle, AlertTriangle, UserPlus, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/hr")({
  head: () => ({ meta: [{ title: "RH & Personnel — Admin. Établissement" }] }),
  component: AdminHR,
});

const TABS = ["Personnel", "Congés & Absences", "Formation", "Recrutement"] as const;
type Tab = (typeof TABS)[number];

function AdminHR() {
  const [tab, setTab] = useState<Tab>("Personnel");
  const [search, setSearch] = useState("");
  const staff = staffMembers.filter(s => s.institutionId === "insat" || s.institutionId === "enit");
  const filtered = staff.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase()));

  const overloaded = staff.filter(s => s.loadStatus === "overloaded").length;
  const avgAbsenteeism = staff.length ? Math.round(staff.reduce((sum, s) => sum + s.absenteeismRate, 0) / staff.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin. · INSAT" title="RH & Personnel" description="Gestion du personnel : registre, congés, formations et recrutements." />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Effectif total" value={staff.length} hint="Tous statuts" accent="navy" />
        <StatCard label="Surcharge" value={overloaded} hint="Charge > 18h/sem" accent={overloaded > 0 ? "destructive" : "success"} />
        <StatCard label="Taux absentéisme" value={`${avgAbsenteeism}%`} hint="Moy. établissement" accent={avgAbsenteeism > 8 ? "warning" : "success"} />
        <StatCard label="Postes ouverts" value={recruitmentPositions.filter(r => r.status === "Ouvert").length} hint="En recrutement" accent="gold" />
      </div>

      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", tab === t ? "bg-card shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Personnel" && (
        <Section title="Registre du personnel" description={`${filtered.length} membres`}>
          <div className="mb-4">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou département…"
              className="w-full max-w-sm h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
          </div>
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Nom</th>
                  <th className="px-5 py-3 text-left font-medium">Rôle</th>
                  <th className="px-5 py-3 text-left font-medium">Département</th>
                  <th className="px-5 py-3 text-center font-medium">Contrat</th>
                  <th className="px-5 py-3 text-center font-medium">Charge</th>
                  <th className="px-5 py-3 text-right font-medium">Statut paiement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center text-xs font-bold text-navy shrink-0">
                          {s.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{s.role}</td>
                    <td className="px-5 py-3 text-muted-foreground">{s.department}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        s.contract === "CDI" ? "bg-success/10 text-success border-success/30" : s.contract === "CDD" ? "bg-warning/10 text-warning border-warning/30" : "bg-muted text-muted-foreground border-border")}>
                        {s.contract}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        s.loadStatus === "overloaded" ? "bg-destructive/10 text-destructive border-destructive/30" : s.loadStatus === "underutilized" ? "bg-muted text-muted-foreground border-border" : "bg-success/10 text-success border-success/30")}>
                        {s.load}h/sem
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium",
                        s.paymentStatus === "Payé" ? "bg-success/10 text-success border-success/30" : s.paymentStatus === "En attente" ? "bg-warning/10 text-warning border-warning/30" : "bg-destructive/10 text-destructive border-destructive/30")}>
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {tab === "Congés & Absences" && (
        <Section title="Demandes de congé" description={`${leaveRequests.filter(l => l.status === "En attente").length} en attente de validation`}>
          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div key={req.id} className={cn("flex items-center gap-4 p-4 rounded-xl border",
                req.status === "En attente" ? "border-warning/25 bg-warning/5" : req.status === "Approuvé" ? "border-success/25 bg-success/5" : "border-border")}>
                <div className="size-10 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                  <Calendar className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{req.staffName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {req.type} · {new Date(req.startDate).toLocaleDateString("fr-FR")} → {new Date(req.endDate).toLocaleDateString("fr-FR")} · {req.days} jour(s)
                  </div>
                  {req.note && <div className="text-xs text-muted-foreground mt-1 italic">"{req.note}"</div>}
                </div>
                <span className={cn("text-[10px] px-2.5 py-1 rounded-full border font-medium uppercase tracking-wider shrink-0",
                  req.status === "En attente" ? "bg-warning/10 text-warning border-warning/30" : req.status === "Approuvé" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground border-border")}>
                  {req.status}
                </span>
                {req.status === "En attente" && (
                  <div className="flex gap-1 shrink-0">
                    <button className="size-8 flex items-center justify-center rounded-lg border border-success/30 bg-success/5 text-success hover:bg-success/15 transition-colors"><CheckCircle2 className="size-4" /></button>
                    <button className="size-8 flex items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/15 transition-colors"><XCircle className="size-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "Formation" && (
        <Section title="Sessions de formation" description={`${trainingSessions.length} sessions programmées`}>
          <div className="space-y-3">
            {trainingSessions.map((t, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-gold/30 transition-colors">
                <div className="size-10 rounded-xl bg-info/10 border border-info/20 flex items-center justify-center shrink-0">
                  <BookOpen className="size-4 text-info" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.domain} · {new Date(t.date).toLocaleDateString("fr-FR")} · {t.participants} participants</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold mb-1">{t.completionRate}%</div>
                  <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-info" style={{ width: `${t.completionRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {tab === "Recrutement" && (
        <div className="space-y-4">
          {recruitmentPositions.map((pos) => (
            <Section key={pos.id} title={pos.title} description={`${pos.department} · ${pos.slots} poste(s) · Limite : ${new Date(pos.deadline).toLocaleDateString("fr-FR")}`}>
              <div className="space-y-2">
                {pos.applicants.map((app, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/20">
                    <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {app.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                      </div>
                      <span className="text-sm font-medium">{app.name}</span>
                    </div>
                    <span className={cn("text-[10px] px-2.5 py-1 rounded-full border font-medium uppercase tracking-wider",
                      app.status === "Recruté" ? "bg-success/10 text-success border-success/30" : app.status === "Entretien" ? "bg-gold/10 text-gold border-gold/30" : app.status === "Rejeté" ? "bg-muted text-muted-foreground border-border" : "bg-info/10 text-info border-info/30")}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}
    </div>
  );
}
