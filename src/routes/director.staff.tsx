import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section, StatCard } from "@/components/ui/page-primitives";
import { Users, GraduationCap, Briefcase, Clock, Search, ChevronRight } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/staff")({
  head: () => ({
    meta: [
      { title: "Personnel — Directeur" },
      { name: "description", content: "Suivi du corps enseignant et administratif." },
    ],
  }),
  component: DirectorStaff,
});

const WORKLOAD = [
  { dept: "Génie Log.", enseignants: 18, admin: 4 },
  { dept: "Réseaux", enseignants: 14, admin: 3 },
  { dept: "Math. App.", enseignants: 10, admin: 2 },
  { dept: "Inf. Indus.", enseignants: 12, admin: 3 },
  { dept: "Physique", enseignants: 8, admin: 2 },
];

const STAFF = [
  { id: 1, name: "Dr. Sami Trabelsi", dept: "Génie Logiciel", grade: "Maître de Conférences", hours: 14, status: "active" },
  { id: 2, name: "Pr. Henda Hajji", dept: "Réseaux & Télécoms", grade: "Professeur", hours: 10, status: "active" },
  { id: 3, name: "Dr. Anis Khouaja", dept: "Math. Appliquées", grade: "Maître-Assistant", hours: 16, status: "active" },
  { id: 4, name: "Dr. Rim Maatouk", dept: "Inf. Industrielle", grade: "Maître de Conférences", hours: 12, status: "leave" },
  { id: 5, name: "Mme. Nadia Ferjani", dept: "Administration", grade: "Secrétaire Générale", hours: 40, status: "active" },
  { id: 6, name: "Mr. Karim Ben Salah", dept: "Génie Logiciel", grade: "Contractuel", hours: 8, status: "active" },
  { id: 7, name: "Dr. Salma Dridi", dept: "Physique", grade: "Maître-Assistant", hours: 14, status: "active" },
  { id: 8, name: "Pr. Mohamed Jallali", dept: "Génie Logiciel", grade: "Professeur HDR", hours: 8, status: "active" },
];

function DirectorStaff() {
  const [query, setQuery] = useState("");
  const filtered = STAFF.filter(
    (s) =>
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.dept.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · INSAT"
        title="Gestion du Personnel"
        description="Corps enseignant, personnels administratifs et suivi de la charge horaire."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Enseignants" value="62" hint="Permanents & contractuels" accent="navy" />
        <StatCard label="Administratifs" value="14" hint="Personnel BIATSS" accent="gold" />
        <StatCard label="Ratio étudiants/enseignant" value="28:1" hint="Objectif MESRS: 25:1" accent="warning" />
        <StatCard label="En congé" value="3" hint="Congé maladie / sabbatique" accent="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Effectifs par département" description="Enseignants & administratifs">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WORKLOAD} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: 8 }} />
                <Bar dataKey="enseignants" fill="var(--navy)" radius={[4, 4, 0, 0]} name="Enseignants" />
                <Bar dataKey="admin" fill="var(--gold)" radius={[4, 4, 0, 0]} name="Administratifs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Annuaire du personnel" description={`${filtered.length} résultat(s)`}>
          <div className="space-y-3">
            <label className="relative block">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un agent..."
                className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-gold/40 transition-colors cursor-pointer"
                >
                  <div className="size-10 rounded-full bg-navy/10 flex items-center justify-center text-navy font-bold text-sm shrink-0">
                    {s.name.split(" ").slice(-1)[0][0]}{s.name.split(" ").slice(-2)[0][0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.grade} · {s.dept}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">{s.hours}h</div>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider",
                        s.status === "active"
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-info/10 text-info border-info/30"
                      )}
                    >
                      {s.status === "active" ? "Actif" : "Congé"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
