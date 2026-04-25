import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useAgentTaskStore, type AgentTask } from "@/stores/agentTaskStore";
import { useClaudeAPI, type ChatMsg } from "@/hooks/useClaudeAPI";
import { useLocation } from "@tanstack/react-router";
import { roleLabel } from "./Sidebar";
import { Sparkles, Bot, X, Send, Loader2, FileDown, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const PAGE_TITLES: Record<string, string> = {
  "/student/dashboard": "Tableau de bord étudiant",
  "/student/grades": "Mes notes",
  "/student/schedule": "Mon emploi du temps",
  "/student/attendance": "Ma présence",
  "/student/internships": "Stages & bourses",
  "/teacher/dashboard": "Tableau de bord enseignant",
  "/admin/dashboard": "Tableau de bord admin établissement",
  "/director/dashboard": "Tableau de bord directeur",
  "/superadmin/dashboard": "Tableau de bord global UCAR",
};

function getPageTitle(path: string) {
  return PAGE_TITLES[path] ?? path;
}

export function CopilotDrawer() {
  const { copilotOpen, closeDrawer, activeDrawerTab } = useUIStore();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 transition-opacity",
          copilotOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={closeDrawer}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-card border-l border-border z-50 shadow-2xl flex flex-col transition-transform duration-300",
          copilotOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md ucar-gradient-navy flex items-center justify-center">
              <Sparkles className="size-4 text-gold" />
            </div>
            <div>
              <div className="font-display font-semibold text-sm">UCAR Intelligence</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Copilote & Agents
              </div>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <Tabs />
        {activeDrawerTab === "copilot" ? <CopilotChat /> : <AgentPanel />}
      </aside>
    </>
  );
}

function Tabs() {
  const { activeDrawerTab, openCopilot, openAgents } = useUIStore();
  return (
    <div className="px-4 pt-3 flex gap-1 border-b border-border">
      <button
        onClick={openCopilot}
        className={cn(
          "px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2",
          activeDrawerTab === "copilot"
            ? "border-gold text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <Sparkles className="size-3.5" /> Copilot
      </button>
      <button
        onClick={openAgents}
        className={cn(
          "px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-2",
          activeDrawerTab === "agents"
            ? "border-gold text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <Bot className="size-3.5" /> Tâches d'agents
      </button>
    </div>
  );
}

function CopilotChat() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { query } = useClaudeAPI();
  const scrollRef = useRef<HTMLDivElement>(null);

  const pageTitle = getPageTitle(location.pathname);

  // Greeting on open / page change
  useEffect(() => {
    if (!user) return;
    setMessages([
      {
        role: "assistant",
        content: `Bonjour **${user.name.split(" ")[0]}**, je suis votre copilote UCAR. Vous êtes sur la page _${pageTitle}_. Je peux vous aider à expliquer les indicateurs, générer des rapports ou résumer les données. Que souhaitez-vous faire ?`,
      },
    ]);
  }, [user, pageTitle]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading || !user) return;
    const userMsg: ChatMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    const system = `Tu es l'assistant IA de la plateforme UCAR pour l'Université de Carthage, Tunisie.
Rôle utilisateur : ${roleLabel(user.role)}
Page actuelle : ${pageTitle}
Établissement : ${user.institutionName}
Réponds dans la langue de l'utilisateur (français, arabe ou anglais). Sois concis, professionnel et data-driven. N'invente jamais de données qui ne sont pas fournies. Si l'on te demande de générer un document ou un rapport, écris-le dans un format structuré.`;
    const reply = await query(input, system, messages);
    setMessages((m) => [...m, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg px-3 py-2 text-sm max-w-[90%] prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2",
              m.role === "user"
                ? "ml-auto bg-navy text-navy-foreground"
                : "bg-muted text-foreground",
            )}
          >
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2">
            <span className="flex gap-1">
              <span className="size-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="size-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="size-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span className="text-xs">L'assistant analyse…</span>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-border bg-background">
        <div className="flex items-end gap-2 bg-muted/50 rounded-lg p-2 border border-transparent focus-within:border-gold transition-colors">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Demandez quelque chose…"
            className="flex-1 bg-transparent outline-none resize-none text-sm max-h-32"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="size-8 rounded-md bg-navy text-gold flex items-center justify-center disabled:opacity-50 hover:bg-navy/90"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
}

function AgentPanel() {
  const tasks = useAgentTaskStore((s) => s.tasks);
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <div className="text-sm font-medium">Aucune tâche d'agent encore</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Les actions automatisées (rapports, demandes de documents, notifications inter-établissement) apparaîtront ici.
          </p>
        </div>
      ) : (
        tasks.map((t) => <AgentTaskCard key={t.id} task={t} />)
      )}
    </div>
  );
}

function AgentTaskCard({ task }: { task: AgentTask }) {
  const statusBadge = {
    pending: { label: "En attente", cls: "bg-muted text-muted-foreground" },
    running: { label: "En cours", cls: "bg-info/10 text-info border border-info/30" },
    done: { label: "Terminé", cls: "bg-success/10 text-success border border-success/30" },
    failed: { label: "Échec", cls: "bg-destructive/10 text-destructive border border-destructive/30" },
  }[task.status];

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {task.type.replace("_", " ")}
          </div>
          <div className="text-sm font-medium truncate">{task.description}</div>
        </div>
        <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", statusBadge.cls)}>
          {statusBadge.label}
        </span>
      </div>
      <ol className="space-y-1">
        {task.steps.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {s.status === "done" ? (
              <CheckCircle2 className="size-3.5 text-success" />
            ) : s.status === "running" ? (
              <Loader2 className="size-3.5 text-gold animate-spin" />
            ) : (
              <Clock className="size-3.5 text-muted-foreground/50" />
            )}
            <span className={cn(s.status === "done" ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>
      {task.result && task.status === "done" && (
        <div className="rounded-md bg-muted/60 border border-border p-2 text-xs">
          {task.result.type === "file" ? (
            <a className="flex items-center gap-2 text-gold hover:underline" href="#">
              <FileDown className="size-3.5" /> Télécharger le document
            </a>
          ) : (
            <div className="prose prose-xs max-w-none">
              <ReactMarkdown>{task.result.content.slice(0, 320)}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
