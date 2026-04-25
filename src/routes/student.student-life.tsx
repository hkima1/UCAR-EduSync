import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { CalendarDays, MapPin, Users, Trophy, Music, Globe, BookOpen, Dumbbell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/student-life")({
  head: () => ({ meta: [{ title: "Vie étudiante — UCAR Étudiant" }] }),
  component: StudentLife,
});

const EVENTS = [
  { id: "e1", title: "Hackathon UCAR 2024", date: "2024-12-14", location: "ENIT — Grande salle", org: "UCAR", category: "Académique", icon: Globe, color: "navy", spots: 120 },
  { id: "e2", title: "Soirée culturelle maghreb", date: "2024-12-20", location: "INSAT — Amphithéâtre", org: "ISAMM", category: "Culture", icon: Music, color: "gold", spots: 250 },
  { id: "e3", title: "Tournoi inter-établissements", date: "2024-12-07", location: "Terrain omnisports", org: "ENIT Sports", category: "Sport", icon: Dumbbell, color: "success", spots: 80 },
  { id: "e4", title: "Forum emploi & stages", date: "2025-01-15", location: "IHEC — Hall principal", org: "IHEC Carthage", category: "Carrière", icon: BookOpen, color: "info", spots: 400 },
  { id: "e5", title: "Journée portes ouvertes", date: "2025-01-22", location: "Tous campus", org: "UCAR", category: "Académique", icon: Globe, color: "navy", spots: 1000 },
  { id: "e6", title: "Gala de fin d'année 2024", date: "2024-12-28", location: "Hôtel Africa, Tunis", org: "ENIT Alumni", category: "Culture", icon: Trophy, color: "warning", spots: 200 },
];

const CLUBS = [
  { name: "Club Informatique & IA", desc: "Ateliers code, hackathons, veille tech.", members: 142, meeting: "Mardi 18h — Salle B302" },
  { name: "Robotics Club ENIT", desc: "Conception de robots compétitifs.", members: 68, meeting: "Jeudi 17h — Lab Mécatronique" },
  { name: "Club Entrepreneuriat", desc: "Pitch, incubation de projets, mentoring.", members: 95, meeting: "Mercredi 18h — Amphi C" },
  { name: "Club Développement Durable", desc: "Actions ESG, campus vert, sensibilisation.", members: 57, meeting: "Vendredi 16h — Hall principal" },
];

const SPORTS = [
  { sport: "Football", day: "Lundi & Jeudi", time: "17h–19h", location: "Terrain n°1" },
  { sport: "Basketball", day: "Mardi & Vendredi", time: "17h–19h", location: "Gymnase A" },
  { sport: "Tennis de table", day: "Mercredi", time: "16h–18h", location: "Salle polyvalente" },
  { sport: "Natation", day: "Samedi", time: "09h–11h", location: "Piscine Marsa" },
];

const CAT_COLOR: Record<string, string> = {
  Académique: "bg-navy/10 text-navy border-navy/20",
  Culture: "bg-gold/10 text-gold border-gold/20",
  Sport: "bg-success/10 text-success border-success/20",
  Carrière: "bg-info/10 text-info border-info/20",
};

function StudentLife() {
  const [rsvpd, setRsvpd] = useState<string[]>([]);
  const [joined, setJoined] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Étudiant · ENIT" title="Vie étudiante" description="Événements campus, clubs, activités sportives et vie associative." />

      {/* Events */}
      <Section title="Événements à venir" description="Activités académiques, culturelles et sportives sur tous les campus">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {EVENTS.map((ev) => {
            const Icon = ev.icon;
            const isRsvpd = rsvpd.includes(ev.id);
            return (
              <div key={ev.id} className="group rounded-xl border border-border bg-card hover:border-gold/30 hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className={cn("h-24 flex items-center justify-center relative overflow-hidden",
                  ev.color === "navy" && "bg-gradient-to-br from-navy to-navy/70",
                  ev.color === "gold" && "bg-gradient-to-br from-gold/80 to-gold/50",
                  ev.color === "success" && "bg-gradient-to-br from-success/70 to-success/40",
                  ev.color === "info" && "bg-gradient-to-br from-info/70 to-info/40",
                  ev.color === "warning" && "bg-gradient-to-br from-warning/70 to-warning/40",
                )}>
                  <div className="absolute inset-0 ucar-grid-bg opacity-20" />
                  <Icon className="relative size-10 text-white/80" />
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider", CAT_COLOR[ev.category] ?? "bg-muted border-border text-muted-foreground")}>
                      {ev.category}
                    </span>
                    <div className="font-display font-semibold mt-2 leading-tight">{ev.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ev.org}</div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><CalendarDays className="size-3" />{new Date(ev.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="size-3" />{ev.location}</div>
                    <div className="flex items-center gap-1.5"><Users className="size-3" />{ev.spots} places</div>
                  </div>
                  <Button size="sm" variant={isRsvpd ? "outline" : "default"} className={cn("mt-auto w-full gap-2", isRsvpd && "border-success/40 text-success hover:bg-success/5")}
                    onClick={() => setRsvpd(prev => isRsvpd ? prev.filter(x => x !== ev.id) : [...prev, ev.id])}>
                    {isRsvpd ? <><CheckCircle2 className="size-3.5" />Inscrit</> : "Je participe"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clubs */}
        <Section title="Clubs & Associations" description="Rejoignez une communauté d'intérêt">
          <div className="space-y-3">
            {CLUBS.map((club, i) => (
              <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:border-gold/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{club.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{club.desc}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                    <span className="flex items-center gap-1"><Users className="size-3" />{club.members} membres</span>
                    <span>{club.meeting}</span>
                  </div>
                </div>
                <Button size="sm" variant={joined.includes(club.name) ? "outline" : "default"}
                  className={cn("shrink-0 gap-1.5", joined.includes(club.name) && "border-success/40 text-success")}
                  onClick={() => setJoined(prev => joined.includes(club.name) ? prev.filter(x => x !== club.name) : [...prev, club.name])}>
                  {joined.includes(club.name) ? <><CheckCircle2 className="size-3.5" />Rejoint</> : "Rejoindre"}
                </Button>
              </div>
            ))}
          </div>
        </Section>

        {/* Sports */}
        <Section title="Activités sportives" description="Programme de la semaine">
          <div className="space-y-2">
            {SPORTS.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border hover:border-gold/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center">
                    <Dumbbell className="size-4 text-success" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{s.sport}</div>
                    <div className="text-xs text-muted-foreground">{s.day} · {s.time}</div>
                    <div className="text-xs text-muted-foreground">{s.location}</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 text-xs">S'inscrire</Button>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
