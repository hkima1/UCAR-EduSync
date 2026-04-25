import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, PriorityBadge, Section, StatCard } from "@/components/ui/page-primitives";
import {
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useAgentTask } from "@/hooks/useAgentTask";
import { cn } from "@/lib/utils";
import {
  buildPrototypeRecords,
  nextStatus,
  statusLabel,
  type PrototypePriority,
  type PrototypeRecord,
  type PrototypeStatus,
} from "@/mock/prototypes";

type BacklogItem = {
  id: string;
  label: string;
  done: boolean;
};

type LayoutVariant = "atelier" | "kanban" | "pulse";
type RoleTone = "student" | "teacher" | "admin" | "director" | "superadmin";

const STATUS_TONE: Record<PrototypeStatus, string> = {
  todo: "bg-warning/10 text-warning border-warning/30",
  running: "bg-info/10 text-info border-info/30",
  done: "bg-success/10 text-success border-success/30",
};

const PRIORITY_LEVEL: Record<PrototypePriority, "info" | "warning" | "critical" | "success"> = {
  low: "info",
  medium: "warning",
  high: "critical",
};

const COLUMN_LABEL: Record<PrototypeStatus, string> = {
  todo: "A traiter",
  running: "En cours",
  done: "Livre",
};

const VARIANT_LABEL: Record<LayoutVariant, string> = {
  atelier: "Atelier de pilotage",
  kanban: "Flux Kanban",
  pulse: "Pulse timeline",
};

const TONE_STYLES: Record<
  RoleTone,
  {
    hero: string;
    glow: string;
    chip: string;
  }
> = {
  student: {
    hero: "from-info/80 via-navy to-navy/95 border-info/30",
    glow: "bg-info/30",
    chip: "bg-white/10 border-white/20 text-white",
  },
  teacher: {
    hero: "from-success/70 via-navy to-navy/95 border-success/30",
    glow: "bg-success/30",
    chip: "bg-white/10 border-white/20 text-white",
  },
  admin: {
    hero: "from-gold/70 via-navy to-navy/95 border-gold/30",
    glow: "bg-gold/35",
    chip: "bg-white/10 border-white/20 text-white",
  },
  director: {
    hero: "from-warning/70 via-navy to-navy/95 border-warning/30",
    glow: "bg-warning/35",
    chip: "bg-white/10 border-white/20 text-white",
  },
  superadmin: {
    hero: "from-navy via-info/70 to-navy/95 border-info/30",
    glow: "bg-info/35",
    chip: "bg-white/10 border-white/20 text-white",
  },
};

function sanitizeId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveVariant(seed: string): LayoutVariant {
  const variants: LayoutVariant[] = ["atelier", "kanban", "pulse"];
  return variants[stableHash(seed) % variants.length] ?? "atelier";
}

function resolveTone(eyebrow: string): RoleTone {
  const value = eyebrow.toLowerCase();
  if (value.includes("etudiant")) return "student";
  if (value.includes("enseignant")) return "teacher";
  if (value.includes("direction")) return "director";
  if (value.includes("ucar")) return "superadmin";
  return "admin";
}

export function StubPage({
  eyebrow,
  title,
  description,
  features,
}: {
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
}) {
  const openCopilot = useUIStore((s) => s.openCopilot);
  const { submitTask } = useAgentTask();

  const safeFeatures = features.length ? features : ["Pilotage", "Qualite", "Execution"];
  const featuresKey = safeFeatures.join("|");
  const tone = useMemo(() => resolveTone(eyebrow), [eyebrow]);
  const variant = useMemo(() => resolveVariant(`${eyebrow}-${title}`), [eyebrow, title]);

  const seedRecords = useMemo(
    () => buildPrototypeRecords({ title, eyebrow, features: safeFeatures }),
    [title, eyebrow, featuresKey],
  );
  const seedBacklog = useMemo<BacklogItem[]>(
    () =>
      safeFeatures.map((feature, index) => ({
        id: `${sanitizeId(feature)}-${index + 1}`,
        label: feature,
        done: index === 0,
      })),
    [featuresKey],
  );

  const [records, setRecords] = useState<PrototypeRecord[]>(() => seedRecords);
  const [backlog, setBacklog] = useState<BacklogItem[]>(() => seedBacklog);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PrototypeStatus>("all");
  const [draftItem, setDraftItem] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);

  useEffect(() => {
    setRecords(seedRecords);
    setBacklog(seedBacklog);
    setQuery("");
    setStatusFilter("all");
    setDraftItem("");
  }, [seedRecords, seedBacklog]);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return records.filter((record) => {
      const statusOk = statusFilter === "all" || record.status === statusFilter;
      const searchOk =
        normalizedQuery.length === 0 ||
        record.title.toLowerCase().includes(normalizedQuery) ||
        record.feature.toLowerCase().includes(normalizedQuery) ||
        record.owner.toLowerCase().includes(normalizedQuery);
      return statusOk && searchOk;
    });
  }, [records, query, statusFilter]);

  const groupedRecords = useMemo(
    () => ({
      todo: filteredRecords.filter((record) => record.status === "todo"),
      running: filteredRecords.filter((record) => record.status === "running"),
      done: filteredRecords.filter((record) => record.status === "done"),
    }),
    [filteredRecords],
  );

  const chartData = useMemo(() => {
    const buckets = new Map<string, { name: string; total: number; done: number; running: number }>();
    for (const record of records) {
      const current = buckets.get(record.feature) ?? {
        name: record.feature.length > 18 ? `${record.feature.slice(0, 18)}...` : record.feature,
        total: 0,
        done: 0,
        running: 0,
      };
      current.total += 1;
      if (record.status === "done") current.done += 1;
      if (record.status === "running") current.running += 1;
      buckets.set(record.feature, current);
    }
    return [...buckets.values()].slice(0, 8);
  }, [records]);

  const trendData = useMemo(
    () =>
      filteredRecords.slice(0, 10).map((record, index) => ({
        index: index + 1,
        score: record.score,
      })),
    [filteredRecords],
  );

  const doneCount = records.filter((record) => record.status === "done").length;
  const runningCount = records.filter((record) => record.status === "running").length;
  const highPriority = records.filter((record) => record.priority === "high").length;
  const completionRate = records.length ? Math.round((doneCount / records.length) * 100) : 0;
  const avgScore = records.length
    ? Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length)
    : 0;

  const addRecord = () => {
    const value = draftItem.trim();
    if (!value) return;

    const newRecord: PrototypeRecord = {
      id: `${sanitizeId(value)}-${records.length + 1}`,
      feature: value,
      title: `${value} - lot prioritaire`,
      owner: records[0]?.owner ?? "Equipe UCAR",
      status: "todo",
      priority: "medium",
      score: 60,
      updatedLabel: "Maintenant",
    };

    setRecords((current) => [newRecord, ...current]);
    setBacklog((current) => [{ id: `${sanitizeId(value)}-check`, label: value, done: false }, ...current]);
    setDraftItem("");
  };

  const advanceRecord = (id: string) => {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? { ...record, status: nextStatus(record.status), updatedLabel: "Maintenant" }
          : record,
      ),
    );
  };

  const archiveRecord = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
  };

  const toggleBacklog = (id: string) => {
    setBacklog((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
    );
  };

  const runAgent = async () => {
    if (agentBusy) return;
    setAgentBusy(true);
    try {
      await submitTask({
        type: "analytics_agent",
        description: `${title} - synthese operationnelle`,
        payload: {
          module: title,
          total: records.length,
          done: doneCount,
          running: runningCount,
        },
        requiresAI: false,
      });
    } finally {
      setAgentBusy(false);
    }
  };

  const renderAtelierView = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <Section
        className="lg:col-span-2"
        title="Registre des operations"
        description="Vue tabulaire multi-critere"
        actions={<BarChart3 className="size-4 text-muted-foreground" />}
      >
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Lot</th>
                <th className="px-3 py-2 text-left font-medium">Responsable</th>
                <th className="px-3 py-2 text-left font-medium">Statut</th>
                <th className="px-3 py-2 text-left font-medium">Priorite</th>
                <th className="px-3 py-2 text-right font-medium">Score</th>
                <th className="px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    Aucun lot ne correspond au filtre actuel.
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 12).map((record) => (
                  <tr key={record.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <div className="font-medium">{record.title}</div>
                      <div className="text-xs text-muted-foreground">{record.updatedLabel}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{record.owner}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider border",
                          STATUS_TONE[record.status],
                        )}
                      >
                        {statusLabel(record.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <PriorityBadge level={PRIORITY_LEVEL[record.priority]} />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">{record.score}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => advanceRecord(record.id)}
                          className="text-xs px-2 py-1 rounded-md border border-border hover:border-gold/60 hover:text-gold"
                        >
                          Avancer
                        </button>
                        <button
                          onClick={() => archiveRecord(record.id)}
                          className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-destructive"
                        >
                          Archiver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Backlog actif"
        description="Checklist immediate"
        actions={<ListTodo className="size-4 text-muted-foreground" />}
      >
        <div className="space-y-2">
          {backlog.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleBacklog(item.id)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                item.done
                  ? "border-success/40 bg-success/5"
                  : "border-border hover:border-gold/50 hover:bg-muted/40",
              )}
            >
              <CheckCircle2 className={cn("size-4", item.done ? "text-success" : "text-muted-foreground")} />
              <span className={item.done ? "line-through text-muted-foreground" : "text-foreground"}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );

  const renderKanbanView = () => (
    <div className="grid gap-6 xl:grid-cols-3">
      {(["todo", "running", "done"] as const).map((status) => (
        <Section
          key={status}
          title={COLUMN_LABEL[status]}
          description={`${groupedRecords[status].length} lot(s)`}
        >
          <div className="space-y-2">
            {groupedRecords[status].slice(0, 8).map((record) => (
              <article key={record.id} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <PriorityBadge level={PRIORITY_LEVEL[record.priority]} />
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", STATUS_TONE[record.status])}>
                    {statusLabel(record.status)}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium">{record.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {record.owner} • score {record.score}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => advanceRecord(record.id)}
                    className="text-xs px-2 py-1 rounded-md border border-border hover:border-gold/60 hover:text-gold"
                  >
                    Suivant
                  </button>
                  <button
                    onClick={() => archiveRecord(record.id)}
                    className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-destructive"
                  >
                    Retirer
                  </button>
                </div>
              </article>
            ))}
            {groupedRecords[status].length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
                Aucun lot ici.
              </div>
            )}
          </div>
        </Section>
      ))}
    </div>
  );

  const renderPulseView = () => (
    <div className="grid gap-6 lg:grid-cols-5">
      <Section className="lg:col-span-3" title="Chronologie active" description="Fil operationnel en continu">
        <div className="relative pl-5 space-y-3">
          <span className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
          {filteredRecords.slice(0, 10).map((record) => (
            <article key={record.id} className="relative rounded-lg border border-border p-3 bg-muted/10">
              <span className="absolute -left-[1.05rem] top-4 size-2.5 rounded-full bg-gold ring-2 ring-background" />
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{record.title}</div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", STATUS_TONE[record.status])}>
                  {statusLabel(record.status)}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {record.owner} • score {record.score} • {record.updatedLabel}
              </div>
              <div className="mt-2 flex items-center gap-1">
                <button
                  onClick={() => advanceRecord(record.id)}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:border-gold/60 hover:text-gold"
                >
                  Avancer
                </button>
                <button
                  onClick={() => archiveRecord(record.id)}
                  className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:text-destructive"
                >
                  Archiver
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section className="lg:col-span-2" title="Pulse qualite" description="Variation du score des lots filtrés">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="index" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[40, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="score" stroke="var(--gold)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          {backlog.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => toggleBacklog(item.id)}
              className={cn(
                "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm",
                item.done ? "border-success/40 bg-success/5" : "border-border hover:border-gold/50",
              )}
            >
              <CheckCircle2 className={cn("size-4", item.done ? "text-success" : "text-muted-foreground")} />
              <span className={item.done ? "line-through text-muted-foreground" : "text-foreground"}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Button onClick={runAgent} variant="outline" className="border-border">
              <PlayCircle className="size-4" />
              {agentBusy ? "Simulation..." : "Simuler un agent"}
            </Button>
            <Button onClick={openCopilot} variant="outline" className="border-gold/40 text-foreground">
              <Sparkles className="size-4 mr-2 text-gold" /> Demander à l'IA
            </Button>
          </>
        }
      />

      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-gradient-to-br px-5 py-6 sm:px-7 sm:py-7 text-white",
          TONE_STYLES[tone].hero,
        )}
      >
        <div className="absolute inset-0 ucar-grid-bg opacity-20" />
        <div className={cn("absolute -top-16 -right-12 size-56 rounded-full blur-3xl", TONE_STYLES[tone].glow)} />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-medium">
              {VARIANT_LABEL[variant]}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-medium">
              Prototype complet mock data
            </span>
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Expérience modulaire intelligente
            </h2>
            <p className="mt-1 text-sm text-white/80 max-w-2xl">
              Chaque page adopte une composition visuelle différente, tout en gardant les mêmes moteurs
              de simulation et d'orchestration.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {safeFeatures.slice(0, 4).map((feature) => (
              <span key={feature} className={cn("rounded-full border px-2.5 py-1 text-xs", TONE_STYLES[tone].chip)}>
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Elements suivis" value={records.length} hint="Prototype operationnel" accent="navy" />
        <StatCard
          label="Taux de livraison"
          value={`${completionRate}%`}
          hint={`${doneCount} livre(s)`}
          trend={completionRate >= 55 ? "up" : "flat"}
          delta={completionRate >= 55 ? "+stable" : "a consolider"}
          accent="success"
        />
        <StatCard
          label="Chantiers en cours"
          value={runningCount}
          hint="Actions en execution"
          accent="warning"
        />
        <StatCard
          label="Score qualite moyen"
          value={avgScore}
          hint={`${highPriority} point(s) critiques`}
          trend={avgScore >= 75 ? "up" : avgScore < 62 ? "down" : "flat"}
          delta={avgScore >= 75 ? "+conforme" : avgScore < 62 ? "-risque" : "en suivi"}
          accent={highPriority > 2 ? "destructive" : "gold"}
        />
      </div>

      <Section
        title="Studio de prototype"
        description="Rechercher, filtrer, ajouter des lots et basculer les états"
        actions={<ArrowRight className="size-4 text-muted-foreground" />}
      >
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="relative flex-1">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher une fonctionnalite, un lot ou un responsable"
                className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | PrototypeStatus)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-gold"
            >
              <option value="all">Tous les statuts</option>
              <option value="todo">A traiter</option>
              <option value="running">En cours</option>
              <option value="done">Livre</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={draftItem}
              onChange={(event) => setDraftItem(event.target.value)}
              placeholder="Ajouter un nouveau lot mock"
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-gold"
            />
            <Button onClick={addRecord} size="sm" className="sm:h-9 sm:px-4">
              <Plus className="size-3.5" /> Ajouter
            </Button>
          </div>
        </div>
      </Section>

      {variant === "atelier" && renderAtelierView()}
      {variant === "kanban" && renderKanbanView()}
      {variant === "pulse" && renderPulseView()}

      <Section>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-semibold text-lg">Progression par fonctionnalite</div>
              <p className="text-sm text-muted-foreground">
                Distribution des volumes, exécutions en cours et lots livrés.
              </p>
            </div>
            <BarChart3 className="size-4 text-muted-foreground" />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="total" name="Total" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="running" name="En cours" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="done" name="Livre" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid md:grid-cols-2 gap-2 mt-2 w-full text-left">
            {safeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm p-3 rounded-lg border border-border bg-muted/30">
                <span className="size-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}
