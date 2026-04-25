import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { MessageSquare, Search, Star, Clock, Send, Paperclip, Users, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Messagerie — Admin. Établissement" },
      { name: "description", content: "Communication interne sécurisée entre services." },
    ],
  }),
  component: AdminMessages,
});

const THREADS = [
  { id: 1, sender: "Dép. Informatique", subject: "Commande de matériel TP — suivi", preview: "Bonjour, les 20 Raspberry Pi ont été réceptionnés. Nous procédons à la vérification inventaire...", time: "10:32", unread: true, starred: true, avatar: "DI", group: false },
  { id: 2, sender: "Scolarité", subject: "Re: Dérogation inscription tardive", preview: "Le dossier de l'étudiant Ben Ali a été complété. Merci de valider la fiche annexe jointe.", time: "09:15", unread: true, starred: false, avatar: "SC", group: false },
  { id: 3, sender: "Conseil Scientifique", subject: "PV Réunion du 18 avril", preview: "Veuillez trouver ci-joint le procès-verbal de la dernière session du conseil scientifique.", time: "Hier", unread: false, starred: false, avatar: "CS", group: true },
  { id: 4, sender: "Services Généraux", subject: "Maintenance Amphi Carthage — terminée", preview: "Nous confirmons la fin des travaux de climatisation. Le local est de nouveau opérationnel.", time: "Hier", unread: false, starred: true, avatar: "SG", group: false },
  { id: 5, sender: "Direction UCAR", subject: "Circulaire n°42 — Calendrier examens", preview: "Suite aux directives ministérielles, le calendrier des examens du S2 est avancé d'une semaine.", time: "Lun.", unread: false, starred: false, avatar: "UC", group: true },
  { id: 6, sender: "RH & Personnel", subject: "Re: Heures supplémentaires — Nov.", preview: "Les fiches de pointage mensuelles ont été mises à jour. Prière de vérifier avant le 30.", time: "Lun.", unread: false, starred: false, avatar: "RH", group: false },
  { id: 7, sender: "Dép. Génie Civil", subject: "Demande de salle de réunion", preview: "Nous aurions besoin de la salle B204 le jeudi 28 avril de 10h à 12h pour une soutenance.", time: "Dim.", unread: false, starred: false, avatar: "GC", group: false },
];

function AdminMessages() {
  const [selected, setSelected] = useState<number>(1);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");

  const filtered = THREADS.filter((t) => {
    if (filter === "unread" && !t.unread) return false;
    if (filter === "starred" && !t.starred) return false;
    const q = query.toLowerCase();
    if (q && !t.sender.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
    return true;
  });

  const active = THREADS.find((t) => t.id === selected);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin. · INSAT"
        title="Messagerie Inter-services"
        description="Communication interne sécurisée entre départements et la direction."
        actions={
          <Button className="gap-2">
            <Send className="size-4" /> Nouveau message
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Thread list */}
        <Section className="lg:col-span-2">
          <div className="space-y-3">
            <label className="relative block">
              <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un message..."
                className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="flex gap-1">
              {(["all", "unread", "starred"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    filter === f ? "bg-navy text-white" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {f === "all" ? "Tous" : f === "unread" ? "Non lus" : "Favoris"}
                </button>
              ))}
            </div>
            <div className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors border",
                    selected === t.id
                      ? "bg-navy/5 border-navy/30"
                      : "border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "size-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                      t.group ? "bg-gold/15 text-gold" : "bg-navy/10 text-navy"
                    )}>
                      {t.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className={cn("text-sm truncate", t.unread ? "font-bold" : "font-medium")}>
                          {t.sender}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{t.time}</span>
                      </div>
                      <div className={cn("text-xs truncate mt-0.5", t.unread ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">{t.preview}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-12">
                    {t.unread && <span className="size-2 rounded-full bg-navy" />}
                    {t.starred && <Star className="size-3 text-gold fill-gold" />}
                    {t.group && <Users className="size-3 text-muted-foreground" />}
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Aucun message trouvé.</div>
              )}
            </div>
          </div>
        </Section>

        {/* Message detail */}
        <Section className="lg:col-span-3">
          {active ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display font-semibold text-lg">{active.subject}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                      active.group ? "bg-gold/15 text-gold" : "bg-navy/10 text-navy"
                    )}>
                      {active.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{active.sender}</div>
                      <div className="text-[11px] text-muted-foreground">Reçu {active.time}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded-md hover:bg-muted transition-colors">
                    <Star className={cn("size-4", active.starred ? "text-gold fill-gold" : "text-muted-foreground")} />
                  </button>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm leading-relaxed text-foreground">{active.preview}</p>
                <p className="text-sm leading-relaxed text-foreground mt-3">
                  Cordialement,<br/>
                  <span className="text-muted-foreground">{active.sender}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <input
                  placeholder="Écrire une réponse..."
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-gold"
                />
                <Button variant="outline" size="sm"><Paperclip className="size-4" /></Button>
                <Button size="sm" className="gap-2"><Send className="size-3.5" /> Envoyer</Button>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <CheckCheck className="size-3 text-success" /> Lu par le destinataire
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <p>Sélectionnez un message pour le lire.</p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
