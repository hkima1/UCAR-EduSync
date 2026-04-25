import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { Send, Search, Paperclip, MoreVertical, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/messages")({
  head: () => ({ meta: [{ title: "Messages — UCAR" }] }),
  component: Messages,
});

const CONVERSATIONS = [
  { id: "c1", name: "Dr. Slim Ben Younès", role: "Enseignant", avatar: "SB", last: "Les corrections du TP seront disponibles vendredi.", time: "14:08", unread: 2, online: true },
  { id: "c2", name: "Bureau de scolarité", role: "Administration", avatar: "BS", last: "Votre demande de relevé est en cours de traitement.", time: "Hier", unread: 0, online: false },
  { id: "c3", name: "Dr. Amira Chaabane", role: "Enseignant", avatar: "AC", last: "N'oubliez pas le TP PostgreSQL lundi prochain.", time: "Lun.", unread: 1, online: false },
  { id: "c4", name: "Groupe INF301", role: "Groupe", avatar: "G5", last: "Yasmine : Quelqu'un a les slides du cours 7 ?", time: "Dim.", unread: 5, online: true },
  { id: "c5", name: "Service carrières", role: "Administration", avatar: "SC", last: "Nouvel offre de stage — Sofrecom Tunisie.", time: "Ven.", unread: 0, online: false },
];

const MESSAGES_C1 = [
  { from: "them", text: "Bonjour, les résultats du TP 3 seront publiés vendredi soir, après correction complète.", time: "11:30" },
  { from: "me", text: "Bonjour Docteur, merci pour l'info ! Aura-t-on un corrigé type ?", time: "11:45" },
  { from: "them", text: "Oui, je mettrai le corrigé en ligne sur la plateforme. Pensez à réviser la section sur les arbres B.", time: "12:10" },
  { from: "me", text: "Parfait, j'ai une question sur l'exercice 4 du TP — la complexité de l'algorithme glouton...", time: "13:55" },
  { from: "them", text: "Les corrections du TP seront disponibles vendredi. On pourra en discuter lors du TD de la semaine prochaine.", time: "14:08" },
];

export function Messages() {
  const [active, setActive] = useState("c1");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState(MESSAGES_C1);

  const handleSend = () => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, { from: "me", text: input, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  const activeConv = CONVERSATIONS.find(c => c.id === active)!;

  return (
    <div className="space-y-0">
      <PageHeader eyebrow="Messages" title="Messagerie" description="Discussions avec vos enseignants, l'administration et vos groupes." />

      <div className="rounded-2xl border border-border overflow-hidden flex h-[600px]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input placeholder="Rechercher…" className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-gold" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {CONVERSATIONS.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)}
                className={cn("w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors relative",
                  active === c.id && "bg-gold/5 border-l-2 border-l-gold")}>
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center text-xs font-bold text-navy">{c.avatar}</div>
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="font-medium text-sm truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{c.time}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{c.last}</div>
                </div>
                {c.unread > 0 && (
                  <span className="size-5 rounded-full bg-gold text-white text-[10px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="size-9 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center text-xs font-bold text-navy">{activeConv.avatar}</div>
              {activeConv.online && <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-success border-2 border-card" />}
            </div>
            <div>
              <div className="font-semibold text-sm">{activeConv.name}</div>
              <div className="text-xs text-muted-foreground">{activeConv.role}{activeConv.online ? " · En ligne" : ""}</div>
            </div>
            <button className="ml-auto p-1.5 text-muted-foreground hover:text-foreground"><MoreVertical className="size-4" /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.from === "me" ? "justify-end" : "justify-start")}>
                {m.from === "them" && (
                  <div className="size-8 rounded-full bg-navy/10 border border-navy/20 flex items-center justify-center text-xs font-bold text-navy shrink-0">{activeConv.avatar}</div>
                )}
                <div className={cn("max-w-xs lg:max-w-md space-y-1", m.from === "me" ? "items-end" : "items-start", "flex flex-col")}>
                  <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    m.from === "me" ? "bg-gold text-white rounded-tr-sm" : "bg-muted/60 border border-border rounded-tl-sm")}>
                    {m.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground px-1">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-5 py-3 border-t border-border flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="size-4" /></button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Écrire un message…"
              className="flex-1 h-9 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-gold" />
            <Button size="sm" onClick={handleSend} disabled={!input.trim()} className="gap-1.5 shrink-0">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
