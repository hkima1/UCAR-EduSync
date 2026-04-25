import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { BookOpen, Award, TrendingUp, Users, GraduationCap, Target } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

export const Route = createFileRoute("/superadmin/academic")({
  head: () => ({
    meta: [
      { title: "Suivi Académique National — UCAR" },
      { name: "description", content: "Taux de réussite et indicateurs académiques consolidés." },
    ],
  }),
  component: SuperAdminAcademic,
});

const PASS_RATES = [
  { inst: "INSAT", rate: 81 },
  { inst: "ENIT", rate: 76 },
  { inst: "IHEC Carthage", rate: 72 },
  { inst: "FST Tunis", rate: 68 },
  { inst: "ISBST", rate: 85 },
  { inst: "ESC Tunis", rate: 74 },
  { inst: "ISET Rades", rate: 65 },
];

const GRAD_TREND = [
  { year: "2020", licence: 2200, master: 680, doctorat: 95 },
  { year: "2021", licence: 2350, master: 720, doctorat: 102 },
  { year: "2022", licence: 2500, master: 780, doctorat: 110 },
  { year: "2023", licence: 2680, master: 810, doctorat: 118 },
  { year: "2024", licence: 2800, master: 860, doctorat: 125 },
];

const ACCREDITATIONS = [
  { program: "Génie Logiciel — INSAT", type: "Licence", status: "Accrédité", expiry: "2027" },
  { program: "Finance Quantitative — IHEC", type: "Master", status: "Accrédité", expiry: "2026" },
  { program: "Biotechnologie — ISBST", type: "Licence", status: "En renouvellement", expiry: "2025" },
  { program: "Génie Civil — ENIT", type: "Ingénieur", status: "Accrédité", expiry: "2028" },
  { program: "Sciences Informatiques — FST", type: "Licence", status: "En cours d'évaluation", expiry: "—" },
];

function SuperAdminAcademic() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · UCAR"
        title="Suivi Académique National"
        description="Taux de réussite, diplomation et accréditations à l'échelle de l'Université de Carthage."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Taux de réussite global" value="74%" hint="Tous établissements" trend="up" delta="+2.1%" accent="success" />
        <StatCard label="Diplômés 2024" value="3,785" hint="Licence + Master + Doctorat" accent="navy" />
        <StatCard label="Programmes accrédités" value="28/34" hint="82% de couverture" accent="gold" />
        <StatCard label="Étudiants inscrits" value="42,180" hint="Année 2024-2025" accent="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Taux de réussite par établissement" description="Année 2024-2025">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PASS_RATES} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                <YAxis dataKey="inst" type="category" stroke="var(--muted-foreground)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} />
                <Bar dataKey="rate" fill="var(--navy)" radius={[0, 6, 6, 0]} name="Taux de réussite" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Évolution de la diplomation" description="Nombre de diplômés par niveau (5 ans)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GRAD_TREND} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="licence" stroke="var(--navy)" strokeWidth={2.5} name="Licence" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="master" stroke="var(--gold)" strokeWidth={2.5} name="Master" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="doctorat" stroke="var(--success)" strokeWidth={2.5} name="Doctorat" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-3 justify-center">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy" />Licence</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold" />Master</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" />Doctorat</span>
          </div>
        </Section>
      </div>

      <Section title="Accréditations des programmes" description="Statut de conformité LMD">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-medium px-4 py-3">Programme</th>
                <th className="text-left font-medium px-4 py-3">Type</th>
                <th className="text-left font-medium px-4 py-3">Statut</th>
                <th className="text-right font-medium px-4 py-3">Expiration</th>
              </tr>
            </thead>
            <tbody>
              {ACCREDITATIONS.map((a, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{a.program}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.type}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-medium ${
                      a.status === "Accrédité" ? "bg-success/10 text-success border-success/30" :
                      a.status.includes("renouvellement") ? "bg-warning/10 text-warning border-warning/30" :
                      "bg-info/10 text-info border-info/30"
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{a.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
