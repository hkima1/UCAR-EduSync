import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { currentTeacher, staffMembers } from "@/mock/staff";
import { courses } from "@/mock/courses";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Sparkles, Clock, Users, BookOpen, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — UCAR Enseignant" }] }),
  component: TeacherDashboard,
});

const TODAY_SCHEDULE = [
  { time: "08h–10h", course: "Algorithmique avancée", room: "B204", students: 42, type: "Cours" },
  { time: "10h–12h", course: "Algorithmique TD", room: "B204", students: 22, type: "TD" },
  { time: "14h–16h", course: "Projet intégré", room: "Atelier 2", students: 18, type: "TP" },
];

const PENDING = [
  { label: "Notes contrôle — Bases de données", urgency: "high", due: "Avant le 5 déc." },
  { label: "Feuille de présence — 25 nov.", urgency: "medium", due: "En retard de 7 jours" },
  { label: "Corrections TP — Algorithmique", urgency: "low", due: "Avant le 12 déc." },
];

const RADAR_DATA = [
  { dimension: "Clarté", c1: 4.1, c2: 3.7 },
  { dimension: "Contenu", c1: 4.3, c2: 4.0 },
  { dimension: "Dispo.", c1: 3.8, c2: 3.5 },
  { dimension: "Équité", c1: 4.0, c2: 3.9 },
  { dimension: "Global", c1: 4.2, c2: 3.8 },
];

const ATTENDANCE_DATA = courses.slice(0, 4).map((c) => ({ name: c.name.split(" ")[0], rate: c.attendanceRate }));

function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const openCopilot = useUIStore((s) => s.openCopilot);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Enseignant · ENIT"
        title={`Bonjour, Dr. ${user?.name.split(" ").pop() ?? "Ben Younès"}`}
        description="Tableau de bord pédagogique — vue d'ensemble de vos cours, étudiants et tâches du jour."
        actions={
          <Button onClick={openCopilot} variant="outline" className="border-gold/40 gap-2">
            <Sparkles className="size-4 text-gold" /> IA Copilot
          </Button>
        }
      />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy/90 to-success/20 border border-navy/30 px-6 py-6 text-white">
        <div className="absolute inset-0 ucar-grid-bg opacity-10" />
        <div className="absolute -top-8 -right-8 size-40 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80 font-medium mb-1">Briefing IA · Aujourd'hui</div>
          <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
            Votre cours d'Algorithmique avancée affiche une tendance à la baisse sur les 3 dernières séances
            (moy. 13.8 → 12.4). Considérez une révision des exercices de programmation dynamique.
            3 tâches en attente dont 1 urgente.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["16h cours/sem.", "42+38 étudiants", "3 tâches en attente"].map((t) => (
              <span key={t} className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 border border-white/15">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cours assignés" value={2} hint="Ce semestre" accent="navy" />
        <StatCard label="Étudiants" value={80} hint="42 + 38 en charge" accent="gold" />
        <StatCard label="Taux de présence moyen" value="88%" hint="Tous cours" trend="up" delta="+2%" accent="success" />
        <StatCard label="Tâches en attente" value={3} hint="1 urgente" accent="destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today schedule */}
        <Section title="Programme du jour" description={`${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`} actions={<Clock className="size-4 text-muted-foreground" />}>
          <div className="space-y-3">
            {TODAY_SCHEDULE.map((slot, i) => (
              <div key={i} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-colors",
                i === 0 ? "border-gold/30 bg-gold/5" : "border-border hover:border-muted-foreground/20")}>
                <div className="text-center shrink-0">
                  <div className="font-mono text-xs font-bold text-muted-foreground">{slot.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{slot.course}</div>
                  <div className="text-xs text-muted-foreground">{slot.room} · <span className="flex items-center gap-1 inline-flex"><Users className="size-3" />{slot.students}</span></div>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider shrink-0",
                  slot.type === "Cours" ? "bg-navy/10 text-navy border-navy/20" : slot.type === "TD" ? "bg-gold/10 text-gold border-gold/20" : "bg-success/10 text-success border-success/20")}>
                  {slot.type}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Pending tasks */}
        <Section title="Tâches en attente" description="Actions à traiter" actions={<AlertTriangle className="size-4 text-muted-foreground" />}>
          <div className="space-y-3">
            {PENDING.map((task, i) => (
              <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border",
                task.urgency === "high" ? "border-destructive/20 bg-destructive/5" : task.urgency === "medium" ? "border-warning/20 bg-warning/5" : "border-border")}>
                <div className={cn("size-2 rounded-full mt-2 shrink-0",
                  task.urgency === "high" ? "bg-destructive" : task.urgency === "medium" ? "bg-warning" : "bg-muted-foreground")} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{task.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{task.due}</div>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7 shrink-0">Traiter</Button>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Satisfaction radar */}
        <Section title="Satisfaction pédagogique" description="Moyenne des évaluations étudiantes" actions={<TrendingUp className="size-4 text-muted-foreground" />}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Radar name="Algorithmique" dataKey="c1" stroke="var(--gold)" fill="var(--gold)" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="BDD" dataKey="c2" stroke="var(--info)" fill="var(--info)" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-2 justify-center">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold inline-block" />Algorithmique</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-info inline-block" />Bases de données</span>
          </div>
        </Section>

        {/* Attendance bar */}
        <Section title="Taux de présence par cours" description="Sessions effectuées">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ATTENDANCE_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`, "Présence"]} />
                <Bar dataKey="rate" name="Présence" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>
    </div>
  );
}
