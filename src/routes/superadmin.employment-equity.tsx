import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Scale, Users, Target, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useEquitableEmploymentAPI, EmploymentReportMeta } from "@/hooks/useEquitableEmploymentAPI";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/superadmin/employment-equity")({
  head: () => ({ meta: [{ title: "Équité & Parité — UCAR" }] }),
  component: SuperAdminEquity,
});

const PARITY_DATA = [
  { role: "Professeurs", F: 42, M: 58 },
  { role: "HDR", F: 45, M: 55 },
  { role: "Adjoints", F: 60, M: 40 },
  { role: "Administration", F: 65, M: 35 },
];

const MOCK_KPI_PAYLOAD = {
  "period": "Academic Year 2025-2026",
  "budget": {
    "total_budget": 12000000,
    "hiring_budget_available": 1800000,
    "per_institution": [
      { "institution": "ENIT", "hiring_budget": 500000 },
      { "institution": "INSAT", "hiring_budget": 450000 },
      { "institution": "FST", "hiring_budget": 850000 }
    ]
  },
  "teaching_staff": {
    "total_professors": 420,
    "per_institution": [
      { "institution": "ENIT", "professor_count": 180 },
      { "institution": "INSAT", "professor_count": 110 },
      { "institution": "FST", "professor_count": 130 }
    ],
    "per_field": [
      { "field": "Computer Science", "professor_count": 150 },
      { "field": "Physics", "professor_count": 90 },
      { "field": "Mathematics", "professor_count": 180 }
    ]
  },
  "students": {
    "total_students": 14500,
    "per_institution": [
      { "institution": "ENIT", "student_count": 4500 },
      { "institution": "INSAT", "student_count": 3200 },
      { "institution": "FST", "student_count": 6800 }
    ],
    "per_field": [
      { "field": "Computer Science", "student_count": 6000 },
      { "field": "Physics", "student_count": 3500 },
      { "field": "Mathematics", "student_count": 5000 }
    ]
  }
};

function SuperAdminEquity() {
  const { submitTask } = useAgentTask();
  const { evaluateAsMarkdown, getReports, getReportById } = useEquitableEmploymentAPI();
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorOutput, setAdvisorOutput] = useState<string>("");
  const [advisorError, setAdvisorError] = useState<string>("");
  const [reportsList, setReportsList] = useState<EmploymentReportMeta[]>([]);

  useEffect(() => {
    getReports().then(setReportsList).catch(console.error);
  }, []);

  const handleSelectReport = async (reportId: string) => {
    setAdvisorLoading(true);
    try {
      const txt = await getReportById(reportId);
      setAdvisorOutput(txt);
      setAdvisorError("");
    } catch (e) {
      setAdvisorError("Failed to load report " + reportId);
    }
    setAdvisorLoading(false);
  };

  const handleAdvisorTask = async () => {
    setAdvisorLoading(true);
    setAdvisorOutput("");
    setAdvisorError("");

    await submitTask({
      type: "analytics_agent",
      description: "Évaluation de l'Équité d'Emploi",
      payload: { source: "equitable_employment_agent", institution: "Réseau UCAR" },
      externalRun: async () => {
        try {
          const result = await evaluateAsMarkdown(MOCK_KPI_PAYLOAD);
          setAdvisorOutput(result);
          getReports().then(setReportsList).catch(console.error); // refresh list
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erreur inconnue";
          setAdvisorError(message);
          throw error;
        }
      },
    });

    setAdvisorLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        eyebrow="Super Admin · UCAR" 
        title="Équité d'Emploi & Diversité" 
        description="Observatoire national de la parité et de la diversité au sein des ressources humaines universitaires." 
        actions={
          <Button onClick={handleAdvisorTask} disabled={advisorLoading} variant="outline" className="border-gold/40 gap-2">
            {advisorLoading ? <Loader2 className="size-4 animate-spin text-gold" /> : <Sparkles className="size-4 text-gold" />}
            Tâche Agent: Analyser
          </Button>
        }
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="size-4" /> Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileText className="size-4" /> Rapports IA</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Parité par grade (Femmes / Hommes %)" description="Données consolidées 2024">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={PARITY_DATA} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="role" type="category" stroke="var(--muted-foreground)" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 8 }} />
                    <Bar dataKey="F" stackId="a" fill="var(--gold)" name="Femmes" radius={[4, 0, 0, 4]} />
                    <Bar dataKey="M" stackId="a" fill="var(--navy)" name="Hommes" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 text-xs mt-4 justify-center">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold" />Femmes</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy" />Hommes</span>
              </div>
            </Section>

            <Section title="Priorités RH & Inclusion">
              <div className="space-y-3">
                {[
                  { title: "Objectif 50% Postes de Direction", progress: 42, target: 50 },
                  { title: "Inclusion Handicap (Loi emploi)", progress: 4.5, target: 6 },
                  { title: "Jeunes chercheurs de moins de 35 ans", progress: 28, target: 30 },
                ].map((p, i) => (
                  <div key={i} className="p-4 border border-border bg-card rounded-xl">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold">{p.title}</span>
                      <span className="text-muted-foreground">{p.progress}% / {p.target}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-success" style={{ width: `${(p.progress / p.target) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-center p-4 bg-muted/30 rounded-xl border border-dashed border-border gap-3 text-sm">
                <Target className="size-5 text-gold" /> 
                Prochain audit gouvernemental : 15 Mars 2025
              </div>
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAdvisorTask} disabled={advisorLoading} className="bg-gold text-navy hover:bg-gold/90 gap-2">
              {advisorLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Générer une nouvelle analyse IA
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Historique des analyses</h3>
              <div className="space-y-2">
                {reportsList.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-xl text-center text-sm text-muted-foreground">
                    Aucun historique.
                  </div>
                ) : (
                  reportsList.map((r) => (
                    <button
                      key={r.report_id}
                      onClick={() => handleSelectReport(r.report_id)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-gold/50 transition-colors"
                    >
                      <div className="font-medium text-sm flex items-center justify-between">
                        {r.report_id}
                        <FileText className="size-3 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(r.created_at * 1000).toLocaleString("fr-FR")}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {!advisorOutput && !advisorError ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-muted/10 text-center h-full min-h-[300px]">
                  <div className="size-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                    <FileText className="size-6 text-gold" />
                  </div>
                  <h3 className="font-semibold mb-1">Sélectionnez ou générez un rapport</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Cliquez sur un rapport dans l'historique ou générez-en un nouveau.
                  </p>
                </div>
              ) : (
                <Section
                  title="Rapport de l'Agent d'Équité d'Emploi"
                  description="Généré par l'API Python d'analyse de la masse salariale"
                >
                  {advisorError ? (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                      {advisorError}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none rounded-lg border border-gold/25 bg-muted/30 p-4">
                      <ReactMarkdown>{advisorOutput}</ReactMarkdown>
                    </div>
                  )}
                </Section>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
