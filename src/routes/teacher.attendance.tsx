import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { students } from "@/mock/students";
import { courses } from "@/mock/courses";
import { CheckCircle2, XCircle, Clock, QrCode, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({ meta: [{ title: "Présence — UCAR Enseignant" }] }),
  component: TeacherAttendance,
});

type Status = "present" | "absent" | "late";
const STATUS_OPTS: { key: Status; label: string; color: string }[] = [
  { key: "present", label: "Présent", color: "bg-success/10 text-success border-success/30 hover:bg-success/20" },
  { key: "absent", label: "Absent", color: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20" },
  { key: "late", label: "Retard", color: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20" },
];

function TeacherAttendance() {
  const [selectedCourse, setSelectedCourse] = useState("c1");
  const [session, setSession] = useState("2024-12-02");
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    Object.fromEntries(students.slice(0, 6).map((s) => [s.id, "present" as Status]))
  );
  const [showQR, setShowQR] = useState(false);
  const { submitTask } = useAgentTask();

  const presentCount = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount = Object.values(statuses).filter((s) => s === "absent").length;

  const handleSubmit = async () => {
    const absent = students.slice(0, 6).filter((s) => statuses[s.id] === "absent");
    await submitTask({
      type: "notify_agent",
      description: `Enregistrement présence — ${courses.find(c => c.id === selectedCourse)?.name} — ${session}`,
      payload: { session, absentStudents: absent.map(s => s.id) },
      targetRole: "student",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Enseignant · ENIT" title="Gestion des présences" description="Marquez les présences par séance, générez un token QR et soumettez aux services pédagogiques." />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cours</label>
          <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold">
            {courses.slice(0, 4).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Séance</label>
          <input type="date" value={session} onChange={e => setSession(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
          <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold">
            <option>Cours</option><option>TD</option><option>TP</option>
          </select>
        </div>
        <Button variant="outline" className="gap-2 ml-auto" onClick={() => setShowQR(!showQR)}>
          <QrCode className="size-4" />{showQR ? "Masquer QR" : "Token QR"}
        </Button>
      </div>

      {/* QR Token */}
      {showQR && (
        <Section title="Token de présence QR" description="Les étudiants scannent ce code pour marquer leur présence automatiquement">
          <div className="flex items-center gap-8">
            <div className="size-40 bg-white border-4 border-navy rounded-xl flex items-center justify-center">
              <QrCode className="size-24 text-navy" />
            </div>
            <div className="space-y-2">
              <div className="font-mono text-2xl font-bold tracking-widest text-gold">INF301-0212</div>
              <p className="text-sm text-muted-foreground">Code valide 15 minutes · Partagez via projecteur</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Régénérer</Button>
                <Button size="sm" variant="outline">Partager</Button>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { label: "Présents", val: presentCount, color: "text-success" },
          { label: "Absents", val: absentCount, color: "text-destructive" },
          { label: "Retards", val: Object.values(statuses).filter(s => s === "late").length, color: "text-warning" },
          { label: "Total", val: students.slice(0, 6).length, color: "text-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className={cn("font-display font-bold text-2xl", s.color)}>{s.val}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => setStatuses(Object.fromEntries(students.slice(0,6).map(s => [s.id, "present"])))}>Tous présents</Button>
          <Button size="sm" className="gap-2" onClick={handleSubmit}><Send className="size-4" />Soumettre</Button>
        </div>
      </div>

      {/* Roster */}
      <Section title="Liste des étudiants" description={`${courses.find(c => c.id === selectedCourse)?.name} — ${session}`} actions={<Users className="size-4 text-muted-foreground" />}>
        <div className="space-y-2">
          {students.slice(0, 6).map((s) => {
            const current = statuses[s.id] ?? "present";
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border hover:border-muted-foreground/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    current === "present" ? "bg-success/10 border border-success/20 text-success" : current === "absent" ? "bg-destructive/10 border border-destructive/20 text-destructive" : "bg-warning/10 border border-warning/20 text-warning")}>
                    {s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.field} · S{s.semester}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {STATUS_OPTS.map(opt => (
                    <button key={opt.key} onClick={() => setStatuses(prev => ({ ...prev, [s.id]: opt.key }))}
                      className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        current === opt.key ? opt.color : "border-border text-muted-foreground hover:border-muted-foreground/40")}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
