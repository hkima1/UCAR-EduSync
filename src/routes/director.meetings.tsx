import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { CalendarDays, Clock, Users, MapPin, FileText, Video, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/meetings")({
  head: () => ({
    meta: [
      { title: "Réunions & Conseils — Directeur" },
      { name: "description", content: "Pilotage des instances dirigeantes et réunions." },
    ],
  }),
  component: DirectorMeetings,
});

const UPCOMING = [
  { id: 1, title: "Conseil Scientifique", date: "2025-05-02", time: "09:00 — 11:30", location: "Salle du Conseil", type: "council", attendees: 12, agenda: ["Bilan recherche S1", "Nouvelles accréditations", "Budget labo"] },
  { id: 2, title: "Réunion Chefs de Département", date: "2025-05-05", time: "14:00 — 15:30", location: "Salle B204", type: "internal", attendees: 6, agenda: ["Planning examens", "Charges horaires S2"] },
  { id: 3, title: "Conseil de Discipline", date: "2025-05-10", time: "10:00 — 12:00", location: "Salle du Conseil", type: "council", attendees: 8, agenda: ["Dossier n°14-B", "Rapport commission"] },
  { id: 4, title: "Visioconférence UCAR", date: "2025-05-12", time: "15:00 — 16:00", location: "En ligne", type: "remote", attendees: 30, agenda: ["Directives ministérielles", "Coordination nationale"] },
];

const PAST = [
  { id: 10, title: "Conseil Pédagogique", date: "2025-04-18", status: "pv_ready", pvUrl: "#" },
  { id: 11, title: "Réunion RH", date: "2025-04-10", status: "pv_ready", pvUrl: "#" },
  { id: 12, title: "Comité de Pilotage ESG", date: "2025-03-28", status: "pv_pending", pvUrl: null },
];

function DirectorMeetings() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · INSAT"
        title="Réunions & Conseils"
        description="Pilotage des instances dirigeantes, sessions à venir et procès-verbaux."
        actions={
          <Button className="gap-2">
            <CalendarDays className="size-4" /> Planifier une réunion
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Réunions ce mois" value="4" hint="Mai 2025" accent="navy" />
        <StatCard label="Conseils statutaires" value="2" hint="Scientifique & Discipline" accent="gold" />
        <StatCard label="PV en attente" value="1" hint="À rédiger / valider" accent="warning" />
        <StatCard label="Participants uniques" value="42" hint="Ce trimestre" accent="info" />
      </div>

      <Section title="Prochaines réunions" description="Sessions planifiées">
        <div className="space-y-4">
          {UPCOMING.map((m) => (
            <div key={m.id} className="p-4 rounded-xl border border-border bg-card hover:border-gold/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="text-center shrink-0 w-16">
                    <div className="text-[10px] uppercase text-muted-foreground font-medium">
                      {new Date(m.date).toLocaleDateString("fr-FR", { month: "short" })}
                    </div>
                    <div className="text-2xl font-display font-bold text-navy">
                      {new Date(m.date).getDate()}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{m.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                      <span className="flex items-center gap-1"><Clock className="size-3" />{m.time}</span>
                      <span className="flex items-center gap-1">
                        {m.type === "remote" ? <Video className="size-3" /> : <MapPin className="size-3" />}
                        {m.location}
                      </span>
                      <span className="flex items-center gap-1"><Users className="size-3" />{m.attendees} participants</span>
                    </div>
                    <div className="mt-3">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Ordre du jour</div>
                      <ul className="space-y-1">
                        {m.agenda.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="size-1 rounded-full bg-gold mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium shrink-0",
                  m.type === "council" ? "bg-navy/10 text-navy border-navy/20" :
                  m.type === "remote" ? "bg-info/10 text-info border-info/20" :
                  "bg-gold/10 text-gold border-gold/20"
                )}>
                  {m.type === "council" ? "Conseil" : m.type === "remote" ? "Visio" : "Interne"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Procès-verbaux récents" description="Sessions passées">
        <div className="space-y-2">
          {PAST.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
              {p.status === "pv_ready" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-success" />
                  <Button variant="outline" size="sm" className="text-xs">Télécharger PV</Button>
                </div>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 uppercase tracking-wider font-medium">
                  PV en attente
                </span>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
