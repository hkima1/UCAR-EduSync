import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { students } from "@/mock/students";
import { gradeRecords, courses } from "@/mock/courses";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/grades")({
  head: () => ({ meta: [{ title: "Saisie des notes — UCAR Enseignant" }] }),
  component: TeacherGrades,
});

const DIST_DATA = [
  { range: "0–4", count: 0 }, { range: "5–9", count: 1 }, { range: "10–14", count: 3 }, { range: "15–20", count: 2 },
];

function TeacherGrades() {
  const [selectedCourse, setSelectedCourse] = useState("c1");
  const [published, setPublished] = useState(false);
  const records = gradeRecords.filter((g) => g.courseId === selectedCourse);
  const avg = records.length ? records.reduce((s, r) => s + r.grade, 0) / records.length : 0;
  const anomaly = avg < 7 || avg > 18;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Enseignant · ENIT" title="Saisie & publication des notes" description="Gérez les notes par cours, détectez les anomalies et publiez vers les portails étudiants." />

      <div className="flex flex-col sm:flex-row gap-3">
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold flex-1 max-w-xs">
          {courses.slice(0, 3).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-gold">
          <option>Examen final — Déc 2024</option>
          <option>Contrôle 1 — Nov 2024</option>
        </select>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Publication :</span>
          <button onClick={() => setPublished(!published)}
            className={cn("relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors focus:outline-none",
              published ? "bg-success border-success" : "bg-muted border-border")}>
            <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", published ? "translate-x-5" : "translate-x-0.5")} />
          </button>
          <span className={cn("text-sm font-medium", published ? "text-success" : "text-muted-foreground")}>{published ? "Publié" : "Non publié"}</span>
        </div>
      </div>

      {anomaly && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/30 bg-warning/5">
          <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-warning">Anomalie détectée</div>
            <p className="text-sm text-muted-foreground mt-0.5">Moyenne {avg.toFixed(1)}/20 — en dehors de la plage normale. Vérifiez les données ou ajustez le barème.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Section className="lg:col-span-2" title="Tableau des notes" description={`${records.length} étudiants · Moyenne : ${avg.toFixed(1)}/20`}>
          {records.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-muted-foreground text-sm">Aucune note saisie pour ce cours.</div>
              <Button className="mt-4 gap-2"><Upload className="size-4" />Importer depuis Excel</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -m-5">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Étudiant</th>
                      <th className="px-5 py-3 text-center font-medium">Note /20</th>
                      <th className="px-5 py-3 text-center font-medium">Statut</th>
                      <th className="px-5 py-3 text-left font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={i} className="border-t border-border hover:bg-muted/30">
                        <td className="px-5 py-3 font-medium">{r.studentName}</td>
                        <td className="px-5 py-3 text-center">
                          <input type="number" defaultValue={r.grade} min={0} max={20} step={0.5}
                            className="w-16 h-8 text-center rounded-lg border border-input bg-background text-sm outline-none focus:border-gold" />
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border",
                            r.status === "Validé" ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30")}>
                            {r.status === "Validé" ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}{r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <input placeholder="Observations…" className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-gold" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-2 justify-end">
                <Button variant="outline" className="gap-2"><Upload className="size-4" />Importer Excel</Button>
                <Button className="gap-2"><CheckCircle2 className="size-4" />Enregistrer les notes</Button>
              </div>
            </>
          )}
        </Section>

        <Section title="Distribution" description="Répartition des notes">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DIST_DATA} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} name="Étudiants" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {[["Moyenne", `${avg.toFixed(1)}/20`], ["Admis", `${records.filter(r => r.grade >= 10).length}/${records.length}`], ["Taux réussite", `${records.length ? Math.round(records.filter(r=>r.grade>=10).length/records.length*100) : 0}%`]].map(([l, v]) => (
              <div key={l} className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-semibold">{v}</span></div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
