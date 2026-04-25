import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { studentSchedule, upcomingExams } from "@/mock/students";
import { Calendar, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/schedule")({
  head: () => ({
    meta: [
      { title: "Emploi du temps — UCAR Étudiant" },
      { name: "description", content: "Visualisez votre emploi du temps hebdomadaire et vos examens à venir." },
    ],
  }),
  component: StudentSchedule,
});

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8h → 20h

const COLOR_MAP: Record<string, string> = {
  navy: "bg-navy/15 border-navy/40 text-navy dark:bg-navy/30",
  gold: "bg-gold/15 border-gold/40 text-gold",
  info: "bg-info/15 border-info/40 text-info dark:text-info",
  success: "bg-success/15 border-success/40 text-success",
  warning: "bg-warning/15 border-warning/40 text-warning",
};

function StudentSchedule() {
  const [view, setView] = useState<"week" | "month">("week");
  const { submitTask } = useAgentTask();

  const handleDownload = async () => {
    await submitTask({
      type: "doc_agent",
      description: "Téléchargement de l'emploi du temps — PDF",
      payload: { studentId: "s1", semester: 5 },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Étudiant · ENIT"
        title="Emploi du temps"
        description="Semestre 5 — Génie Informatique. Visualisation semaine & examens à venir."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => setView("week")}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === "week" ? "bg-card shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
              >
                Semaine
              </button>
              <button
                onClick={() => setView("month")}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors", view === "month" ? "bg-card shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
              >
                Examens
              </button>
            </div>
            <Button variant="outline" className="gap-2 border-border" onClick={handleDownload}>
              <Download className="size-4" />
              Télécharger PDF
            </Button>
          </div>
        }
      />

      {view === "week" ? (
        <Section title="Semaine courante" description="Semaine du 2 décembre 2024" actions={<Calendar className="size-4 text-muted-foreground" />}>
          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <button className="p-1.5 rounded-lg border border-border hover:border-gold/40 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-medium">Semaine 49 · 2–7 déc 2024</span>
            <button className="p-1.5 rounded-lg border border-border hover:border-gold/40 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Timetable grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {/* Day headers */}
              <div className="grid gap-px" style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>
                <div />
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div className="relative border border-border rounded-xl overflow-hidden">
                {HOURS.map((hour, hi) => (
                  <div
                    key={hour}
                    className="grid gap-px border-t border-border first:border-t-0"
                    style={{ gridTemplateColumns: "56px repeat(6, 1fr)", minHeight: "56px" }}
                  >
                    {/* Hour label */}
                    <div className="flex items-center justify-center text-[11px] text-muted-foreground font-mono bg-muted/20 px-1">
                      {hour}:00
                    </div>
                    {/* Day cells */}
                    {DAYS.map((_, di) => {
                      const slot = studentSchedule.find((s) => s.day === di && s.start === hour);
                      const isOccupied = studentSchedule.some((s) => s.day === di && s.start < hour && s.end > hour);
                      if (isOccupied) return <div key={di} className="bg-background" />;
                      if (!slot) return <div key={di} className="bg-background hover:bg-muted/20 transition-colors" />;

                      const spanHours = slot.end - slot.start;
                      return (
                        <div
                          key={di}
                          className={cn(
                            "relative rounded-lg m-0.5 p-2 border text-xs overflow-hidden cursor-default select-none",
                            COLOR_MAP[slot.color] ?? COLOR_MAP["navy"],
                          )}
                          style={{ gridRow: `span ${spanHours}` }}
                        >
                          <div className="font-semibold leading-tight truncate">{slot.course}</div>
                          <div className="mt-0.5 opacity-70 truncate">{slot.professor}</div>
                          <div className="mt-0.5 opacity-60 font-mono">{slot.room}</div>
                          <div className="mt-1 text-[10px] opacity-60">{slot.start}h – {slot.end}h</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { label: "Algorithmique", color: "navy" },
              { label: "Bases de données", color: "gold" },
              { label: "Réseaux", color: "info" },
              { label: "Génie logiciel", color: "success" },
              { label: "Anglais", color: "warning" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("size-2.5 rounded-sm inline-block", COLOR_MAP[l.color]?.split(" ")[0])} />
                {l.label}
              </div>
            ))}
          </div>
        </Section>
      ) : (
        /* Exam calendar view */
        <div className="space-y-4">
          <Section title="Examens à venir" description="Calendrier des épreuves — Décembre 2024">
            <div className="space-y-3">
              {upcomingExams.map((exam, i) => {
                const d = new Date(exam.date);
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-gold/40 bg-card hover:bg-muted/30 transition-colors">
                    <div className="size-14 shrink-0 rounded-xl bg-navy/5 border border-navy/10 flex flex-col items-center justify-center">
                      <span className="text-[9px] uppercase font-bold text-navy/60 leading-none">
                        {d.toLocaleString("fr-FR", { month: "short" })}
                      </span>
                      <span className="font-display font-bold text-navy text-xl leading-none mt-0.5">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{exam.course}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {exam.time} · Salle {exam.room}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-warning/10 text-warning border border-warning/30 font-medium">
                        Examen final
                      </span>
                      <span className="text-xs text-muted-foreground">120 min</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Mini calendar grid */}
          <Section title="Décembre 2024" description="Vue mensuelle">
            <div className="grid grid-cols-7 gap-1 text-center">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <div key={i} className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium py-1">
                  {d}
                </div>
              ))}
              {/* Offset for Dec 1 = Sunday → 6 */}
              {Array.from({ length: 6 }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1;
                const examDays = [12, 15, 18];
                const isExam = examDays.includes(day);
                const isToday = day === 2;
                return (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square flex items-center justify-center text-sm rounded-lg font-medium transition-colors",
                      isExam && "bg-gold/20 text-gold border border-gold/40 font-semibold",
                      isToday && !isExam && "bg-navy/10 text-navy border border-navy/20",
                      !isExam && !isToday && "text-muted-foreground hover:bg-muted/40",
                    )}
                    title={isExam ? `Examen — ${day}/12` : undefined}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-gold/20 border border-gold/40" />
                Jour d'examen
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded bg-navy/10 border border-navy/20" />
                Aujourd'hui
              </span>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
