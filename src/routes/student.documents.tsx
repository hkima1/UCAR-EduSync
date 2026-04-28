import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { FileText, GraduationCap, ClipboardList, CreditCard, BookOpen, Briefcase, Download, Clock, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTask } from "@/hooks/useAgentTask";
import { useLegalDocumentAPI } from "@/hooks/useLegalDocumentAPI";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/documents")({
  head: () => ({ meta: [{ title: "Documents — UCAR Étudiant" }] }),
  component: StudentDocuments,
});

const DOCS = [
  { id: "attestation", icon: FileText, label: "Attestation d'inscription", desc: "Justificatif officiel d'inscription à l'université.", delay: "2–3 jours ouvrés", color: "navy" },
  { id: "presence", icon: ClipboardList, label: "Attestation de présence", desc: "Confirme votre présence physique aux cours.", delay: "2–3 jours ouvrés", color: "info" },
  { id: "releve", icon: BookOpen, label: "Relevé de notes officiel", desc: "Bulletin de notes signé et cacheté.", delay: "3–5 jours ouvrés", color: "gold" },
  { id: "carte", icon: CreditCard, label: "Réimpression carte étudiante", desc: "En cas de perte ou détérioration.", delay: "5–7 jours ouvrés", color: "warning" },
  { id: "conge", icon: GraduationCap, label: "Lettre de congé académique", desc: "Demande officielle de suspension temporaire.", delay: "7–10 jours ouvrés", color: "success" },
  { id: "stage", icon: Briefcase, label: "Autorisation de stage", desc: "Lettre officielle pour votre entreprise d'accueil.", delay: "2–3 jours ouvrés", color: "destructive" },
];

const COLOR_CONFIG: Record<string, { icon: string; bar: string }> = {
  navy: { icon: "bg-navy/10 border-navy/20 text-navy", bar: "bg-navy" },
  info: { icon: "bg-info/10 border-info/20 text-info", bar: "bg-info" },
  gold: { icon: "bg-gold/10 border-gold/20 text-gold", bar: "bg-gold" },
  warning: { icon: "bg-warning/10 border-warning/20 text-warning", bar: "bg-warning" },
  success: { icon: "bg-success/10 border-success/20 text-success", bar: "bg-success" },
  destructive: { icon: "bg-destructive/10 border-destructive/20 text-destructive", bar: "bg-destructive" },
};

const HISTORY = [
  { doc: "Attestation d'inscription", date: "2024-10-03", status: "Prêt", ref: "#DOC-2024-0318" },
  { doc: "Relevé de notes officiel", date: "2024-09-20", status: "Prêt", ref: "#DOC-2024-0291" },
  { doc: "Autorisation de stage", date: "2024-09-01", status: "Archivé", ref: "#DOC-2024-0244" },
];

function StudentDocuments() {
  const [requesting, setRequesting] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [modalDoc, setModalDoc] = useState<typeof DOCS[0] | null>(null);
  const [lang, setLang] = useState<"FR" | "EN" | "AR">("FR");
  const { submitTask } = useAgentTask();
  const { generateDocument } = useLegalDocumentAPI();

  const handleRequest = async () => {
    if (!modalDoc) return;
    setRequesting(modalDoc.id);
    setModalDoc(null);
    
    // UI Task visual log
    await submitTask({ type: "workflow_agent", description: `Demande : ${modalDoc.label}`, payload: { docId: modalDoc.id, lang }, targetRole: "institution_admin" });
    await submitTask({ type: "doc_agent", description: `Génération IA : ${modalDoc.label}`, payload: { docId: modalDoc.id, lang, studentId: "A-002" } });
    
    try {
      // Trigger the real Python agent
      const downloadUrl = await generateDocument("A-002");
      // Open the downloaded PDF in a new tab
      window.open(downloadUrl, '_blank');
      setDone((prev) => [...prev, modalDoc.id]);
    } catch (error) {
      console.error("Legal Agent generation failed:", error);
      alert("Failed to generate the legal document.");
    }

    setRequesting(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Étudiant · ENIT" title="Documents administratifs" description="Demandez vos documents officiels en ligne. L'agent traite votre demande et vous notifie dès que le document est prêt." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DOCS.map((doc) => {
          const Icon = doc.icon;
          const cfg = COLOR_CONFIG[doc.color] ?? COLOR_CONFIG["navy"];
          const isDone = done.includes(doc.id);
          const isLoading = requesting === doc.id;
          return (
            <div key={doc.id} className="group rounded-2xl border border-border bg-card hover:border-gold/30 hover:shadow-md transition-all flex flex-col overflow-hidden">
              <div className={cn("h-1 w-full", cfg.bar)} />
              <div className="p-5 flex flex-col gap-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("size-11 rounded-xl border flex items-center justify-center shrink-0", cfg.icon)}>
                    <Icon className="size-5" />
                  </div>
                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30 font-medium uppercase tracking-wider">
                      <CheckCircle2 className="size-3" /> Demandé
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold">{doc.label}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{doc.desc}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3" /> Délai : {doc.delay}
                  </div>
                </div>
                <Button
                  size="sm"
                  className={cn("w-full gap-2 border", isDone ? "" : "border-gold/40")}
                  disabled={isDone || isLoading}
                  variant={isDone ? "outline" : "default"}
                  onClick={() => setModalDoc(doc)}
                >
                  {isLoading ? (
                    <><Clock className="size-4 animate-spin text-gold" />Génération IA en cours…</>
                  ) : isDone ? (
                    <><Download className="size-4" />Téléchargé</>
                  ) : (
                    <><Plus className="size-4 text-gold" />Demander Document IA</>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setModalDoc(null)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display font-semibold text-lg">{modalDoc.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">{modalDoc.desc}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium block mb-2">Langue du document</label>
                <div className="flex gap-2">
                  {(["FR", "EN", "AR"] as const).map((l) => (
                    <button key={l} onClick={() => setLang(l)}
                      className={cn("flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                        lang === l ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/30")}>
                      {l === "FR" ? "Français" : l === "EN" ? "English" : "العربية"}
                    </button>
                  ))}
                </div>
              </div>
              <textarea rows={2} placeholder="Remarques ou précisions (facultatif)…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold resize-none" />
            </div>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" onClick={handleRequest}>Confirmer la demande</Button>
              <Button variant="outline" onClick={() => setModalDoc(null)}>Annuler</Button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <Section title="Historique des demandes" description="Vos dernières demandes de documents">
        <div className="overflow-x-auto -m-5">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Document</th>
                <th className="px-5 py-3 text-left font-medium">Date</th>
                <th className="px-5 py-3 text-left font-medium">Référence</th>
                <th className="px-5 py-3 text-right font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium">{h.doc}</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(h.date).toLocaleDateString("fr-FR")}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{h.ref}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border",
                      h.status === "Prêt" ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground border-border")}>
                      {h.status === "Prêt" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
