import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { Inbox, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/demands")({
  head: () => ({ meta: [{ title: "Boîte de demandes — Admin. Établissement" }] }),
  component: AdminDemands,
});

function AdminDemands() {
  const demands = [
    { id: 1, type: "Achat Matériel", from: "Dép. Informatique", date: "Hier", status: "pending", desc: "Acquisition de 20 Raspberry Pi 4 pour travaux pratiques IoT." },
    { id: 2, type: "Dérogation Inscription", from: "Scolarité", date: "Lun.", status: "pending", desc: "Validation tardive pour l'étudiant Ben Ali M." },
    { id: 3, type: "Avis Réparation", from: "Services Généraux", date: "Il y a 3 jours", status: "approved", desc: "Réparation de la climatisation Amphi Carthage." },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin. · INSAT" title="Boîte de Demandes" description="File d'attente des approbations, dérogations et formulaires administratifs." />

      <Section title="Demandes en attente" description="2 éléments requièrent votre attention" actions={<Inbox className="size-5 text-muted-foreground" />}>
        <div className="space-y-3">
          {demands.map((d) => (
            <div key={d.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-4 hover:border-muted-foreground/30 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{d.type}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{d.from}</span>
                </div>
                <p className="text-sm mt-1 text-muted-foreground">{d.desc}</p>
                <div className="text-[10px] text-muted-foreground mt-2">{d.date}</div>
              </div>
              {d.status === "pending" ? (
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" className="gap-1.5 h-8 bg-success hover:bg-success/90 text-white"><CheckCircle2 className="size-4"/> Approuver</Button>
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-destructive hover:bg-destructive/10"><XCircle className="size-4"/> Rejeter</Button>
                </div>
              ) : (
                <div className="shrink-0 text-success text-sm font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-4" /> Approuvé
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
