import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { ShieldAlert, Activity, Users, FileWarning, ShieldCheck, BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

export const Route = createFileRoute("/superadmin/monitoring")({
  head: () => ({ meta: [{ title: "Système de Monitoring — UCAR" }] }),
  component: MonitoringDashboard,
});

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

type Metrics = {
  fraudAlerts: number;
  unauthorizedAccess: number;
  activeUsers: number;
  loginSuccess: number;
  loginFailed: number;
};

function usePrometheusMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const url = API_BASE.replace('/api', '/metrics');
        const res = await fetch(url);
        const text = await res.text();
        
        const data: Metrics = {
          fraudAlerts: 0,
          unauthorizedAccess: 0,
          activeUsers: 0,
          loginSuccess: 0,
          loginFailed: 0,
        };

        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('#') || line.trim() === '') continue;
          
          const parts = line.split(' ');
          if (parts.length < 2) continue;
          
          const val = parseFloat(parts[parts.length - 1]);
          
          if (line.startsWith('ucar_db_fraud_alerts_total')) {
            data.fraudAlerts = val;
          } else if (line.startsWith('ucar_db_unauthorized_access_total')) {
            data.unauthorizedAccess = val;
          } else if (line.startsWith('ucar_db_active_users_total')) {
            data.activeUsers = val;
          } else if (line.startsWith('ucar_db_login_attempts_total')) {
            if (line.includes('status="success"')) data.loginSuccess = val;
            if (line.includes('status="failed"')) data.loginFailed = val;
          }
        }
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
}

function MonitoringDashboard() {
  const metrics = usePrometheusMetrics();

  const chartData = [
    { name: "Connexions Réussies", value: metrics?.loginSuccess || 0, fill: "#22c55e" },
    { name: "Échecs de Connexion", value: metrics?.loginFailed || 0, fill: "#eab308" },
    { name: "Alertes Fraude", value: metrics?.fraudAlerts || 0, fill: "#ef4444" },
    { name: "Accès Non Autorisés", value: metrics?.unauthorizedAccess || 0, fill: "#f97316" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        eyebrow="Superadmin · UCAR" 
        title="Système de Monitoring & Sécurité" 
        description="Surveillance en temps réel via Prometheus. Les données sont actualisées automatiquement toutes les 5 secondes." 
      />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="size-6 text-destructive" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Alertes de fraude</div>
            <div className="font-display text-2xl font-bold">{metrics ? metrics.fraudAlerts : '...'}</div>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="size-12 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
            <FileWarning className="size-6 text-warning" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Accès non autorisés</div>
            <div className="font-display text-2xl font-bold">{metrics ? metrics.unauthorizedAccess : '...'}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="size-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-6 text-success" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Logins Réussis</div>
            <div className="font-display text-2xl font-bold">{metrics ? metrics.loginSuccess : '...'}</div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
          <div className="size-12 rounded-full bg-info/10 flex items-center justify-center shrink-0">
            <Users className="size-6 text-info" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</div>
            <div className="font-display text-2xl font-bold">{metrics ? metrics.activeUsers : '...'}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Événements de Sécurité (Live)" description="Distribution des tentatives d'accès et alertes système">
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Flux Prometheus (Raw Data)" description="Données brutes issues de /metrics en direct">
          <div className="h-[350px] w-full mt-4 bg-navy rounded-xl p-4 overflow-auto font-mono text-xs text-green-400">
            {metrics ? (
              <>
                <div className="text-white/50 mb-4"># HELPER ucar_db_fraud_alerts_total</div>
                <div>ucar_db_fraud_alerts_total <span className="text-white">{metrics.fraudAlerts}</span></div>
                
                <div className="text-white/50 mb-4 mt-4"># HELPER ucar_db_unauthorized_access_total</div>
                <div>ucar_db_unauthorized_access_total <span className="text-white">{metrics.unauthorizedAccess}</span></div>
                
                <div className="text-white/50 mb-4 mt-4"># HELPER ucar_db_login_attempts_total</div>
                <div>ucar_db_login_attempts_total{"{"}status="success"{"}"} <span className="text-white">{metrics.loginSuccess}</span></div>
                <div>ucar_db_login_attempts_total{"{"}status="failed"{"}"} <span className="text-white">{metrics.loginFailed}</span></div>
                
                <div className="text-white/50 mb-4 mt-4"># HELPER ucar_db_active_users_total</div>
                <div>ucar_db_active_users_total <span className="text-white">{metrics.activeUsers}</span></div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/50">
                <BarChart3 className="size-6 mr-2 animate-pulse" /> Récupération des données...
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
