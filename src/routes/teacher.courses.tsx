import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { courses } from "@/mock/courses";
import { students } from "@/mock/students";
import { studentGrades } from "@/mock/students";
import { CheckCircle2, Clock, BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/courses")({
  head: () => ({ meta: [{ title: "Mes cours — UCAR Enseignant" }] }),
  component: TeacherCourses,
});

function TeacherCourses() {
  const [selected, setSelected] = useState<string | null>(null);
  const myCourses = courses.filter(c => c.teacherId === "t1");
  const activeCourse = myCourses.find(c => c.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Enseignant · ENIT" title="Mes cours" description="Gestion des cours assignés : sessions, syllabus et matériaux pédagogiques." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myCourses.map((c) => {
          const completedSessions = c.sessions.filter(s => s.status === "completed").length;
          const progress = Math.round((completedSessions / c.sessions.length) * 100);
          return (
            <button key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)}
              className={cn("text-left rounded-2xl border bg-card p-5 hover:border-gold/40 hover:shadow-md transition-all",
                selected === c.id ? "border-gold/40 shadow-lg shadow-gold/5 bg-gold/5" : "border-border")}>
              <div className="flex items-start justify-between gap-2">
                <div className="size-11 rounded-xl bg-navy/8 border border-navy/15 flex items-center justify-center shrink-0">
                  <BookOpen className="size-5 text-navy" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
              </div>
              <div className="mt-3 font-display font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.department} · S{c.semester} · {c.credits} crédits</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[{ l: "Étudiants", v: c.studentCount }, { l: "Moy.", v: `${c.avgGrade}/20` }, { l: "Présence", v: `${c.attendanceRate}%` }].map(k => (
                  <div key={k.l} className="rounded-lg bg-muted/40 py-2">
                    <div className="font-bold text-sm">{k.v}</div>
                    <div className="text-[10px] text-muted-foreground">{k.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sessions</span><span>{completedSessions}/{c.sessions.length} complètes</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {activeCourse && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={`Séances — ${activeCourse.name}`} description={`${activeCourse.sessions.length} séances programmées`}>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {activeCourse.sessions.map((s) => (
                <div key={s.id} className={cn("flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  s.status === "completed" ? "border-success/20 bg-success/5" : s.status === "planned" ? "border-border hover:border-muted-foreground/20" : "border-destructive/20 bg-destructive/5")}>
                  <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0",
                    s.status === "completed" ? "bg-success/10" : "bg-muted/40")}>
                    {s.status === "completed" ? <CheckCircle2 className="size-4 text-success" /> : <Clock className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.topic}</div>
                    <div className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString("fr-FR")} · {s.type}</div>
                    {s.notes && <div className="text-xs text-warning mt-0.5">{s.notes}</div>}
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider shrink-0",
                    s.type === "Cours" ? "bg-navy/10 text-navy border-navy/20" : s.type === "TD" ? "bg-gold/10 text-gold border-gold/20" : "bg-success/10 text-success border-success/20")}>
                    {s.type}
                  </span>
                </div>
              ))}
            </div>
            <Button className="mt-4 gap-2 w-full" variant="outline"><Plus className="size-4" />Ajouter une séance</Button>
          </Section>

          <Section title="Syllabus" description={`${activeCourse.code} — description officielle`}>
            <p className="text-sm text-muted-foreground leading-relaxed">{activeCourse.syllabus}</p>
            <div className="mt-5 space-y-3">
              <div className="font-semibold text-sm">Ressources pédagogiques</div>
              {["Cours magistraux (PDF)", "Supports TD & exercices", "Sujets d'examens archivés", "Références bibliographiques"].map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-gold/30 transition-colors">
                  <span className="text-sm">{r}</span>
                  <Button size="sm" variant="outline" className="text-xs">Téléverser</Button>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
