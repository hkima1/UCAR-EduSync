import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { studentAbsences, studentSchedule } from "@/mock/students";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { AlertTriangle, CheckCircle2, XCircle, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/attendance")({
  head: () => ({
    meta: [
      { title: "Présence — UCAR Étudiant" },
      { name: "description", content: "Suivi de présence par cours, justifications et alertes IA." },
    ],
  }),
  component: StudentAttendance,
});

// Compute per-course attendance from schedule & absences
const COURSE_ATTENDANCE = [
  { course: "Algorithmique avancée", total: 11, absent: 0, rate: 100 },
  { course: "Bases de données", total: 8, absent: 1, rate: 88 },
  { course: "Réseaux", total: 6, absent: 2, rate: 67 },
  { course: "Génie logiciel", total: 7, absent: 1, rate: 86 },
  { course: "Anglais technique", total: 5, absent: 1, rate: 80 },
  { course: "Projet intégré", total: 4, absent: 0, rate: 100 },
];

const overallRate = Math.round(
  COURSE_ATTENDANCE.reduce((s, c) => s + c.rate, 0) / COURSE_ATTENDANCE.length
);

function StudentAttendance() {
  const [justifying, setJustifying] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { submitTask } = useAgentTask();

  const atRisk = overallRate < 75;
  const unjustified = studentAbsences.filter((a) => a.status === "Non justifiée");

  const handleJustify = async (absenceDate: string) => {
    await submitTask({
      type: "workflow_agent",
      description: `Justification d'absence — ${absenceDate}`,
      payload: { date: absenceDate, reason, studentId: "s1" },
      targetRole: "teacher",
    });
    setJustifying(null);
    setReason("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Étudiant · ENIT"
        title="Suivi de présence"
        description="Histogramme de présence par cours, absences à justifier et alertes de risque académique."
      />

      {/* AI risk banner */}
      {atRisk ? (
        <div className="relative overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-destructive">Alerte IA — Risque d'exclusion</div>
              <p className="text-sm text-muted-foreground mt-1">
                Votre taux de présence global ({overallRate}%) est inférieur au seuil critique de 75%.
                Vous risquez d'être exclu de <strong>2 examens</strong>. Régularisez vos absences avant la fin du mois.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-success/30 bg-success/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-success">Présence conforme</div>
              <p className="text-sm text-muted-foreground mt-1">
                Votre taux global ({overallRate}%) est au-dessus du seuil requis de 75%.
                Continuez sur cette lancée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Présence globale"
          value={`${overallRate}%`}
          hint="Toutes matières confondues"
          trend={overallRate >= 80 ? "up" : overallRate >= 75 ? "flat" : "down"}
          delta={overallRate >= 80 ? "En règle" : atRisk ? "⚠ Risque" : "Limite"}
          accent={overallRate >= 80 ? "success" : overallRate >= 75 ? "warning" : "destructive"}
        />
        <StatCard
          label="Absences totales"
          value={studentAbsences.length}
          hint="Ce semestre"
          accent="warning"
        />
        <StatCard
          label="Non justifiées"
          value={unjustified.length}
          hint="Action requise"
          accent={unjustified.length > 0 ? "destructive" : "success"}
        />
        <StatCard
          label="Cours à risque"
          value={COURSE_ATTENDANCE.filter((c) => c.rate < 75).length}
          hint="Taux < 75%"
          accent={COURSE_ATTENDANCE.some((c) => c.rate < 75) ? "destructive" : "success"}
        />
      </div>

      {/* Bar chart */}
      <Section title="Taux de présence par cours" description="Seuil critique : 75%" actions={<span className="text-xs text-muted-foreground">Semestre 5</span>}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COURSE_ATTENDANCE} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="course"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickFormatter={(v) => v.split(" ").slice(0, 2).join(" ")}
              />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(val) => [`${val}%`, "Présence"]}
              />
              <ReferenceLine
                y={75}
                stroke="var(--destructive)"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: "Seuil 75%", position: "insideTopRight", fontSize: 11, fill: "var(--destructive)" }}
              />
              <Bar
                dataKey="rate"
                name="Présence"
                radius={[6, 6, 0, 0]}
                fill="var(--chart-4)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Absence log */}
      <Section
        title="Journal des absences"
        description={`${studentAbsences.length} absence(s) enregistrée(s) ce semestre`}
      >
        <div className="space-y-3">
          {studentAbsences.map((absence, i) => {
            const isJustified = absence.status === "Justifiée";
            const isBeingJustified = justifying === absence.date;
            return (
              <div key={i} className={cn("rounded-xl border p-4 transition-colors", isJustified ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isJustified ? (
                      <CheckCircle2 className="size-5 text-success shrink-0" />
                    ) : (
                      <XCircle className="size-5 text-destructive shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">{absence.course}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(absence.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        {" · "}{absence.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border",
                      isJustified
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-destructive/10 text-destructive border-destructive/30",
                    )}>
                      {absence.status}
                    </span>
                    {!isJustified && !isBeingJustified && (
                      <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => setJustifying(absence.date)}>
                        <Upload className="size-3" />
                        Justifier
                      </Button>
                    )}
                  </div>
                </div>

                {/* Justification form inline */}
                {isBeingJustified && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Motif de l'absence (maladie, urgence familiale, déplacement professionnel...)"
                      className="w-full h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-gold/40 text-sm text-muted-foreground cursor-pointer">
                        <Upload className="size-4" />
                        Joindre un justificatif
                        <input type="file" className="hidden" />
                      </label>
                      <Button size="sm" className="gap-1.5" onClick={() => handleJustify(absence.date)}>
                        <Send className="size-3" />
                        Envoyer
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setJustifying(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
