import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { courses } from "@/mock/courses";
import { FileText, Download, Upload, CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/exams")({
  head: () => ({ meta: [{ title: "Examens — UCAR Enseignant" }] }),
  component: TeacherExams,
});

function TeacherExams() {
  const teacherCourses = courses.filter((c) => c.teacherId === "t1");
  const upcomingExams = [
    { course: "Algorithmique", date: "2024-12-18", time: "09:00", room: "S104", status: "drafting", type: "Final" },
    { course: "Bases de données", date: "2024-12-20", time: "14:00", room: "Amphi A", status: "submitted", type: "Final" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Enseignant · ENIT" title="Gestion des examens" description="Dépôt des sujets, consultation du planning et directives de surveillance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Examens programmés" value={upcomingExams.length} hint="Session principale" accent="navy" />
        <StatCard label="Sujets déposés" value="1/2" hint="Date limite: 10 déc." accent="warning" />
        <StatCard label="Surveillances" value="3" hint="Assignées ce semestre" accent="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Dépôt des sujets d'examen" description="Vos cours ce semestre" actions={<FileText className="size-4 text-muted-foreground" />}>
          <div className="space-y-4">
            {upcomingExams.map((ex, i) => (
              <div key={i} className={cn("p-4 rounded-xl border flex flex-col gap-3",
                ex.status === "submitted" ? "border-success/30 bg-success/5" : "border-warning/30 bg-card")}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider",
                      ex.type === "Final" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-info/10 text-info border-info/20")}>
                      {ex.type}
                    </span>
                    <div className="font-semibold mt-2">{ex.course}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <CalendarDays className="size-3 inline mr-1" />
                      {new Date(ex.date).toLocaleDateString("fr-FR")} · {ex.time} · {ex.room}
                    </div>
                  </div>
                  {ex.status === "submitted" ? (
                    <CheckCircle2 className="size-5 text-success" />
                  ) : (
                    <AlertTriangle className="size-5 text-warning" />
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant={ex.status === "submitted" ? "outline" : "default"} className="flex-1 gap-2">
                    {ex.status === "submitted" ? <><Download className="size-3.5" />Télécharger</> : <><Upload className="size-3.5" />Déposer (PDF)</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Planning des surveillances" description="Sessions assignées">
          <div className="space-y-3">
            {[
              { date: "15 déc.", time: "09:00 - 11:00", course: "Mathématiques", room: "S202", role: "Principal" },
              { date: "17 déc.", time: "14:00 - 16:00", course: "Physique", room: "Amphi B", role: "Assistant" },
              { date: "22 déc.", time: "09:00 - 12:00", course: "Réseaux", room: "S101", role: "Principal" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card">
                <div className="text-center shrink-0 w-16">
                  <div className="text-xs font-bold">{s.date}</div>
                  <div className="text-[10px] text-muted-foreground">{s.time}</div>
                </div>
                <div className="w-px h-8 bg-border shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.course}</div>
                  <div className="text-xs text-muted-foreground">{s.room} · {s.role}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
