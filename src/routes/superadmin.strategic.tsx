import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2, FileText, Download, Target, BrainCircuit, Activity, TrendingUp, Wallet, AlertTriangle, Trophy } from "lucide-react";
import { useStrategicAdvisorAPI, StrategicMetrics } from "@/hooks/useStrategicAdvisorAPI";
import { useAgentTask } from "@/hooks/useAgentTask";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/superadmin/strategic")({
  head: () => ({ meta: [{ title: "Analyse Stratégique — UCAR" }] }),
  component: SuperAdminStrategic,
});

const PROCESS_STEPS = [
  { id: "init", label: "Initialisation des KPIs", icon: Activity },
  { id: "analyze", label: "Analyse Stratégique (LLM)", icon: BrainCircuit },
  { id: "pdf", label: "Génération du Rapport PDF", icon: FileText },
  { id: "done", label: "Terminé", icon: CheckCircle2 },
];

function SuperAdminStrategic() {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [metrics, setMetrics] = useState<StrategicMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { evaluate, getMetrics } = useStrategicAdvisorAPI();
  const { submitTask } = useAgentTask();

  const handleRunAgent = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);
    setMetrics(null);
    setActiveStep(0); // init

    try {
      await submitTask({
        type: "analytics_agent",
        description: "Préparation des données KPI pour l'analyse stratégique...",
        payload: { source: "strategic_advisor" }
      });

      // Advance to LLM analysis
      setActiveStep(1); 
      
      const result = await evaluate();
      
      // Advance to PDF generation
      setActiveStep(2);
      
      // Fetch metrics
      if (result.report_id) {
        try {
          const m = await getMetrics(result.report_id);
          setMetrics(m);
        } catch (metricsErr) {
          console.error("Failed to fetch metrics, but continuing pipeline:", metricsErr);
        }
      }

      await new Promise(r => setTimeout(r, 1000)); 

      setActiveStep(3); // Done
      setReportData(result);

    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite lors de la génération.");
      setActiveStep(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (reportData?.download_url) {
      window.open(reportData.download_url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · UCAR"
        title="Analyse Stratégique & Prospective"
        description="Générez un rapport stratégique complet basé sur l'évaluation des KPIs via notre Agent IA spécialisé."
        actions={
          <Button 
            onClick={handleRunAgent} 
            disabled={loading} 
            className="bg-gold hover:bg-gold/90 text-navy font-semibold gap-2 border shadow-lg h-11 px-6"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <Sparkles className="size-5" />}
            Lancer Conseiller Stratégique IA
          </Button>
        }
      />

      {/* Metrics Highlights Section */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <MetricCard 
            title="Taux de Réussite Global" 
            value={`${metrics.overall_success}%`} 
            icon={TrendingUp} 
            color="blue"
            trend={metrics.overall_success >= 75 ? "Target met" : "Below target"}
          />
          <MetricCard 
            title="Utilisation Budget" 
            value={`${metrics.budget_utilization}%`} 
            icon={Wallet} 
            color="gold"
            trend={`${(metrics.surplus / 1000).toFixed(0)}k surplus`}
          />
          <MetricCard 
            title="Zones Critiques" 
            value={metrics.critical_fields.length.toString()} 
            icon={AlertTriangle} 
            color="red"
            trend={metrics.critical_fields.join(", ")}
          />
          <MetricCard 
            title="Top Performance" 
            value={metrics.top_performing_inst} 
            icon={Trophy} 
            color="green"
            trend="Efficiency leader"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Process Flow Column */}
        <div className="lg:col-span-1 space-y-6">
          <Section title="Pipeline de l'Agent Stratégique" description="Suivi du processus de génération">
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
              {PROCESS_STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                const isPast = activeStep > index;

                return (
                  <div key={step.id} className="relative flex items-center gap-4">
                    <div className={cn(
                      "size-10 rounded-full flex items-center justify-center border-2 bg-background z-10 transition-all duration-500",
                      isActive ? "border-gold text-gold shadow-[0_0_15px_rgba(255,204,0,0.4)] scale-110" : 
                      isPast ? "border-success text-success bg-success/10" : 
                      "border-muted text-muted-foreground opacity-50"
                    )}>
                      <Icon className="size-5" />
                    </div>
                    <div className={cn(
                      "flex-1 p-3 rounded-lg border transition-all duration-300",
                      isActive ? "bg-gold/5 border-gold/40 shadow-sm" :
                      isPast ? "bg-success/5 border-success/30" :
                      "bg-muted/5 border-transparent text-muted-foreground"
                    )}>
                      <div className="font-semibold text-sm">{step.label}</div>
                      {isActive && <div className="text-[10px] uppercase font-bold text-gold mt-1 flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Traitement...</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {activeStep === 3 && reportData && (
              <div className="mt-8 pt-6 border-t border-dashed border-border text-center">
                <Button 
                  onClick={handleDownloadPdf}
                  className="w-full bg-navy hover:bg-navy/90 text-white gap-2 shadow-2xl ring-2 ring-gold/40 py-6 text-lg font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="size-6" />
                  TÉLÉCHARGER LE PDF
                </Button>
                <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-semibold">Format Officiel UCAR • Signé par l'Agent</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-lg border border-red-500/30 bg-red-500/5 text-red-500 text-sm flex gap-3">
                <AlertTriangle className="size-5 shrink-0" />
                <div>
                  <strong className="block mb-1">Erreur de Pipeline</strong>
                  {error}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Report Preview Column */}
        <div className="lg:col-span-2">
          <Section title="Aperçu du Rapport Stratégique" description="Le rapport détaillé généré par l'IA">
            {!reportData && !loading && (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-muted/5 text-center min-h-[500px]">
                <div className="size-20 rounded-full bg-gold/10 flex items-center justify-center mb-6">
                  <Target className="size-10 text-gold opacity-50" />
                </div>
                <h3 className="text-xl font-bold mb-2">En attente de génération</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  L'agent stratégique attend vos instructions pour scanner la base de données et produire ses conclusions prospectives.
                </p>
              </div>
            )}

            {loading && !reportData && (
              <div className="flex flex-col items-center justify-center p-12 border border-border rounded-xl bg-muted/5 text-center min-h-[500px]">
                <div className="relative mb-8">
                   <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full animate-pulse"></div>
                   <Loader2 className="size-16 text-gold animate-spin relative z-10" />
                </div>
                <h3 className="text-xl font-bold">Rédaction du rapport en cours</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">Gemma-4-31B-IT analyse les corrélations financières et académiques...</p>
              </div>
            )}

            {reportData && (
              <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-navy p-6 text-white flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="size-4 text-gold" />
                      <span className="text-[10px] uppercase tracking-tighter font-bold text-gold/80">Rapport de Synthèse Exécutive</span>
                      {reportData.fallback && (
                        <span className="text-[9px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-400/30 px-2 py-0.5 rounded-full ml-1">
                          ⚡ Fallback Mode
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl font-black italic">STRATEGIC_ADVISOR_v1.0</h2>
                    <p className="text-xs text-white/60 font-mono mt-1">REF: {reportData.report_id} • TS: {new Date(reportData.generated_at).getTime()}</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-black text-red-500">{reportData.warnings_count}</div>
                      <div className="text-[9px] uppercase font-bold text-white/50 tracking-widest">Alertes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-gold">{reportData.insights_count}</div>
                      <div className="text-[9px] uppercase font-bold text-white/50 tracking-widest">Insights</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 prose prose-slate max-w-none prose-headings:text-navy prose-strong:text-navy prose-a:text-gold border-x border-b">
                   <ReactMarkdown>{reportData.report_text}</ReactMarkdown>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color, trend }: { title: string, value: string, icon: any, color: "blue" | "gold" | "red" | "green", trend: string }) {
  const colors = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    gold: "text-gold bg-gold/10 border-gold/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
  };

  return (
    <div className={cn("p-5 rounded-xl border bg-card shadow-sm flex flex-col gap-3", colors[color])}>
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg bg-background/50 border border-current/10">
          <Icon className="size-5" />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">{title}</div>
      </div>
      <div>
        <div className="text-3xl font-black tracking-tight text-foreground">{value}</div>
        <div className="text-[11px] font-semibold mt-1 flex items-center gap-1.5 opacity-80">
          <Activity className="size-3" />
          {trend}
        </div>
      </div>
    </div>
  );
}
