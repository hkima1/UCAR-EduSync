import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { students, studentGrades, studentAbsences } from "@/mock/students";
import { Search, AlertTriangle, CheckCircle2, TrendingDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/students")({
  head: () => ({ meta: [{ title: "Étudiants — UCAR Enseignant" }] }),
  component: TeacherStudents,
});

function RiskBadge({ gpa, attendance }: { gpa: number; attendance: number }) {
  const risk = gpa < 10 || attendance < 70 ? "high" : gpa < 12 || attendance < 80 ? "medium" : "low";
  const cfg = { high: "bg-destructive/10 text-destructive border-destructive/30", medium: "bg-warning/10 text-warning border-warning/30", low: "bg-success/10 text-success border-success/30" };
  const label = { high: "À risque", medium: "Attention", low: "OK" };
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wider", cfg[risk])}>{label[risk]}</span>;
}

function TeacherStudents() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = students.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedStudent = students.find(s => s.id === selected);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Enseignant · ENIT" title="Mes étudiants" description="Liste des étudiants, profils, notes, absences et signalement de risque académique." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un étudiant…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-gold" />
          </div>
          <Section className="p-0" title="Roster" description={`${filtered.length} étudiants`}>
            <div className="divide-y divide-border">
              {filtered.map((s) => (
                <button key={s.id} onClick={() => setSelected(selected === s.id ? null : s.id)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left",
                    selected === s.id && "bg-gold/5")}>
                  <div className={cn("size-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0",
                    s.gpa >= 14 ? "bg-success/10 border-success/20 text-success" : s.gpa >= 10 ? "bg-navy/10 border-navy/20 text-navy" : "bg-destructive/10 border-destructive/20 text-destructive")}>
                    {s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">GPA {s.gpa} · Présence {s.attendanceRate}%</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <RiskBadge gpa={s.gpa} attendance={s.attendanceRate} />
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </Section>
        </div>

        {/* Profile detail */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="space-y-4">
              {/* Profile header */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-navy/5 to-background p-6">
                <div className="flex items-start gap-4">
                  <div className="size-16 rounded-2xl bg-navy/10 border-2 border-navy/20 flex items-center justify-center text-xl font-bold text-navy">
                    {selectedStudent.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display font-bold text-xl">{selectedStudent.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-navy/10 border border-navy/20 text-navy font-medium">{selectedStudent.field}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">S{selectedStudent.semester}</span>
                      <RiskBadge gpa={selectedStudent.gpa} attendance={selectedStudent.attendanceRate} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {[{ l: "GPA", v: selectedStudent.gpa }, { l: "Présence", v: `${selectedStudent.attendanceRate}%` }, { l: "Crédits", v: selectedStudent.credits }, { l: "Total", v: selectedStudent.totalCredits }].map(k => (
                    <div key={k.l} className="text-center rounded-xl bg-muted/40 py-3">
                      <div className="font-display font-bold text-xl">{k.v}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{k.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grades */}
              <Section title="Notes récentes" description="S5 2024">
                <div className="space-y-2">
                  {studentGrades.slice(0, 4).map((g, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                      <div>
                        <div className="text-sm font-medium">{g.course}</div>
                        <div className="text-xs text-muted-foreground font-mono">{g.code}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${(g.grade / g.max) * 100}%` }} />
                        </div>
                        <span className="font-bold text-sm w-12 text-right">{g.grade}/{g.max}</span>
                        {g.grade >= 10 ? <CheckCircle2 className="size-4 text-success shrink-0" /> : <AlertTriangle className="size-4 text-destructive shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2"><AlertTriangle className="size-4 text-warning" />Signaler</Button>
                <Button variant="outline" className="flex-1 gap-2"><TrendingDown className="size-4 text-info" />Historique</Button>
                <Button className="flex-1 gap-2">Contacter</Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-border text-center p-12">
              <div>
                <div className="text-muted-foreground text-sm">Sélectionnez un étudiant pour voir son profil complet</div>
                <div className="text-xs text-muted-foreground mt-1">Notes, présences, notes d'observation</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
