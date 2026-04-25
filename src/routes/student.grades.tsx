import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader, StatCard, Section } from "@/components/ui/page-primitives";
import { studentGrades, gpaTrend, currentStudent } from "@/mock/students";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, BarChart, Bar,
} from "recharts";
import { BookOpen, Download, TrendingUp, Award, AlertCircle, CheckCircle2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/student/grades")({
  head: () => ({
    meta: [
      { title: "Notes & Résultats — UCAR Étudiant" },
      { name: "description", content: "Consultez vos notes par matière, votre progression GPA et demandez un relevé officiel." },
    ],
  }),
  component: StudentGrades,
});

const SEMESTER_TABS = ["S5 (actuel)", "S4", "S3", "S2", "S1"] as const;
type SemTab = (typeof SEMESTER_TABS)[number];

const SEM_NUM: Record<SemTab, number> = {
  "S5 (actuel)": 5,
  S4: 4,
  S3: 3,
  S2: 2,
  S1: 1,
};

function GradeBadge({ grade, max }: { grade: number; max: number }) {
  const pct = (grade / max) * 100;
  const ok = grade >= 10;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border",
        ok
          ? "bg-success/10 text-success border-success/30"
          : "bg-destructive/10 text-destructive border-destructive/30",
      )}
    >
      {ok ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
      {ok ? "Validé" : "Échec"}
    </span>
  );
}

function StudentGrades() {
  const [activeTab, setActiveTab] = useState<SemTab>("S5 (actuel)");
  const [requesting, setRequesting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [transcriptLang, setTranscriptLang] = useState<"FR" | "EN" | "AR">("FR");
  const { submitTask } = useAgentTask();

  const semNum = SEM_NUM[activeTab];
  const filtered = useMemo(
    () => studentGrades.filter((g) => g.semester === semNum),
    [semNum],
  );

  const semAvg = filtered.length
    ? filtered.reduce((s, g) => s + g.grade, 0) / filtered.length
    : 0;
  const totalCredits = filtered.reduce((s, g) => s + g.credits, 0);
  const validatedCredits = filtered.filter((g) => g.grade >= 10).reduce((s, g) => s + g.credits, 0);
  const passRate = filtered.length
    ? Math.round((filtered.filter((g) => g.grade >= 10).length / filtered.length) * 100)
    : 0;

  const distData = [
    { range: "0–4", count: filtered.filter((g) => g.grade < 5).length },
    { range: "5–9", count: filtered.filter((g) => g.grade >= 5 && g.grade < 10).length },
    { range: "10–14", count: filtered.filter((g) => g.grade >= 10 && g.grade < 15).length },
    { range: "15–20", count: filtered.filter((g) => g.grade >= 15).length },
  ];

  const handleRequestTranscript = async () => {
    setRequesting(true);
    setShowForm(false);
    await submitTask({
      type: "workflow_agent",
      description: "Demande de relevé de notes officiel",
      payload: { studentId: currentStudent.id, lang: transcriptLang },
      targetRole: "institution_admin",
    });
    await submitTask({
      type: "doc_agent",
      description: `Relevé de notes officiel — ${currentStudent.name} (${transcriptLang})`,
      payload: { studentId: currentStudent.id, lang: transcriptLang, gpa: currentStudent.gpa },
    });
    setRequesting(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Étudiant · ENIT"
        title="Notes & Résultats"
        description="Vue complète de vos résultats académiques, progression GPA et demande de documents officiels."
        actions={
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="border-gold/40 text-foreground gap-2"
          >
            <FileDown className="size-4 text-gold" />
            Relevé officiel
          </Button>
        }
      />

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy/90 to-info/30 border border-navy/40 px-6 py-7 text-white">
        <div className="absolute inset-0 ucar-grid-bg opacity-10" />
        <div className="absolute -top-10 -right-10 size-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold/80 font-medium mb-1">
              Moyenne générale · {activeTab}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display text-6xl font-bold text-gold">
                {semAvg.toFixed(2)}
              </span>
              <span className="text-white/50 text-xl">/20</span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              {validatedCredits} / {totalCredits} crédits validés · Taux de réussite {passRate}%
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 py-3 rounded-xl bg-white/10 border border-white/15">
              <div className="font-display text-2xl font-bold text-white">{currentStudent.gpa.toFixed(1)}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">GPA cumulé</div>
            </div>
            <div className="text-center px-4 py-3 rounded-xl bg-white/10 border border-white/15">
              <div className="font-display text-2xl font-bold text-white">{currentStudent.credits}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 mt-0.5">Crédits totaux</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Moyenne semestre" value={semAvg.toFixed(2)} hint={`sur 20 — ${activeTab}`} trend="up" delta="+0.3 vs S4" accent="gold" />
        <StatCard label="Crédits validés" value={`${validatedCredits}/${totalCredits}`} hint="Ce semestre" accent="success" />
        <StatCard label="Taux de réussite" value={`${passRate}%`} hint="Matières validées" trend={passRate >= 80 ? "up" : "flat"} accent={passRate >= 80 ? "success" : "warning"} />
        <StatCard label="Matières" value={filtered.length} hint={`${filtered.filter(g => g.grade < 10).length} en échec`} accent={filtered.some(g => g.grade < 10) ? "destructive" : "navy"} />
      </div>

      {/* Transcript request form */}
      {showForm && (
        <Section title="Demander un relevé de notes officiel" description="Document officiel signé par le chef d'établissement">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Langue du document</label>
              <div className="flex gap-2">
                {(["FR", "EN", "AR"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setTranscriptLang(l)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      transcriptLang === l
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border hover:border-gold/40",
                    )}
                  >
                    {l === "FR" ? "Français" : l === "EN" ? "English" : "العربية"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRequestTranscript} disabled={requesting} className="gap-2">
                <Download className="size-4" />
                {requesting ? "Traitement en cours..." : "Confirmer la demande"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </div>
        </Section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {SEMESTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grade table */}
        <Section
          className="lg:col-span-2"
          title="Relevé détaillé"
          description={`${filtered.length} matières — ${activeTab}`}
          actions={<BookOpen className="size-4 text-muted-foreground" />}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Aucune note disponible pour ce semestre.
            </div>
          ) : (
            <div className="overflow-x-auto -m-5">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Cours</th>
                    <th className="px-5 py-3 text-left font-medium">Code</th>
                    <th className="px-5 py-3 text-center font-medium">Crédits</th>
                    <th className="px-5 py-3 text-right font-medium">Note</th>
                    <th className="px-5 py-3 text-right font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g, i) => (
                    <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium">{g.course}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{g.code}</td>
                      <td className="px-5 py-3 text-center text-muted-foreground">{g.credits}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="font-display font-semibold text-base">
                          {g.grade.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground text-xs">/{g.max}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <GradeBadge grade={g.grade} max={g.max} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Distribution */}
        <Section title="Distribution des notes" description={`${activeTab} — répartition`} actions={<TrendingUp className="size-4 text-muted-foreground" />}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="range" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Étudiants" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {filtered.map((g, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: g.grade >= 15 ? "var(--success)" : g.grade >= 10 ? "var(--chart-2)" : "var(--destructive)" }} />
                <span className="truncate flex-1 text-muted-foreground">{g.course}</span>
                <span className="font-semibold">{g.grade.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* GPA trend */}
      <Section title="Évolution de la moyenne générale" description="Progression sur les semestres passés" actions={<Award className="size-4 text-muted-foreground" />}>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gpaTrend} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="semester" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis domain={[10, 18]} stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <ReferenceLine
                y={10}
                stroke="var(--destructive)"
                strokeDasharray="4 4"
                label={{ value: "Min. validation (10)", position: "insideTopRight", fontSize: 10, fill: "var(--destructive)" }}
              />
              <Line type="monotone" dataKey="gpa" stroke="var(--gold)" strokeWidth={2.5} dot={{ r: 5, fill: "var(--gold)", stroke: "var(--background)", strokeWidth: 2 }} activeDot={{ r: 7 }} name="Moyenne" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Progress bar credits */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Crédits cumulés</span>
            <span className="font-medium">{currentStudent.credits} / {currentStudent.totalCredits}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-gold/70 transition-all"
              style={{ width: `${(currentStudent.credits / currentStudent.totalCredits) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progression vers diplôme</span>
            <span>{Math.round((currentStudent.credits / currentStudent.totalCredits) * 100)}%</span>
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>Besoin d'un relevé officiel ?</span>
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2">
          <Download className="size-4" />
          Demander le relevé
        </Button>
      </div>
    </div>
  );
}
