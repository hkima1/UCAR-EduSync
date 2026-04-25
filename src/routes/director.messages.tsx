import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { MessageSquare, Search, Star, Send, Users, Paperclip, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/director/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Directeur" },
      { name: "description", content: "Communication avec les départements et la présidence." },
    ],
  }),
  component: DirectorMessages,
});

const THREADS = [
  { id: 1, sender: "Présidence UCAR", subject: "Réunion annuelle des directeurs", preview: "Cher(e) Directeur, la réunion annuelle est fixée au 15 mai. Merci de préparer un bilan de votre établissement.", time: "11:20", unread: true, starred: true, avatar: "PU", group: true },
  { id: 2, sender: "Chef Dép. Informatique", subject: "Besoin urgent de contractuels pour le S2", preview: "Suite aux départs, nous avons un déficit de 3 enseignants. Demande de recrutement en urgence.", time: "09:40", unread: true, starred: false, avatar: "CI", group: false },
  { id: 3, sender: "Secrétaire Générale", subject: "PV Conseil Scientifique — Validation", preview: "Le PV est prêt pour signature. Veuillez trouver la version finale jointe.", time: "Hier", unread: false, starred: false, avatar: "SG", group: false },
  { id: 4, sender: "Direction MESRS", subject: "Circulaire — Nouveau barème des heures supp.", preview: "Application immédiate du nouveau barème à compter de janvier...", time: "Lun.", unread: false, starred: true, avatar: "MS", group: true },
  { id: 5, sender: "Responsable Scolarité", subject: "Anomalies inscriptions — 12 dossiers", preview: "12 dossiers incomplets détectés lors de la vérification des inscriptions du S2.", time: "Dim.", unread: false, starred: false, avatar: "RS", group: false },
];

function DirectorMessages() {
  const [selected, setSelected] = useState<number>(1);
  const [query, setQuery] = useState("");

  const filtered = THREADS.filter((t) => {
    const q = query.toLowerCase();
    return !q || t.sender.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });
  const active = THREADS.find((t) => t.id === selected);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directeur · INSAT"
        title="Messages Internes"
        description="Communication avec les départements, la scolarité et la présidence UCAR."
        actions={<Button className="gap-2"><Send className="size-4" /> Nouveau</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Section className="lg:col-span-2">
          <div className="space-y-3">
            <label className="relative block">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-gold" />
            </label>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map((t) => (
                <button key={t.id} onClick={() => setSelected(t.id)} className={cn("w-full text-left p-3 rounded-lg transition-colors border", selected === t.id ? "bg-navy/5 border-navy/30" : "border-transparent hover:bg-muted/50")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("size-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", t.group ? "bg-gold/15 text-gold" : "bg-navy/10 text-navy")}>{t.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className={cn("text-sm truncate", t.unread ? "font-bold" : "font-medium")}>{t.sender}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{t.time}</span>
                      </div>
                      <div className={cn("text-xs truncate mt-0.5", t.unread ? "font-semibold" : "text-muted-foreground")}>{t.subject}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 ml-12">
                    {t.unread && <span className="size-2 rounded-full bg-navy" />}
                    {t.starred && <Star className="size-3 text-gold fill-gold" />}
                    {t.group && <Users className="size-3 text-muted-foreground" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section className="lg:col-span-3">
          {active ? (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-semibold text-lg">{active.subject}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className={cn("size-8 rounded-full flex items-center justify-center text-[10px] font-bold", active.group ? "bg-gold/15 text-gold" : "bg-navy/10 text-navy")}>{active.avatar}</div>
                  <div>
                    <div className="text-sm font-medium">{active.sender}</div>
                    <div className="text-[11px] text-muted-foreground">{active.time}</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm leading-relaxed">{active.preview}</p>
                <p className="text-sm leading-relaxed mt-3">Cordialement,<br/><span className="text-muted-foreground">{active.sender}</span></p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <input placeholder="Écrire une réponse..." className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
                <Button variant="outline" size="sm"><Paperclip className="size-4" /></Button>
                <Button size="sm" className="gap-2"><Send className="size-3.5" /> Envoyer</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p>Sélectionnez un message.</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
