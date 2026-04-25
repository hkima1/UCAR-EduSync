import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { currentStudent } from "@/mock/students";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  KeyRound, 
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "Mon Profil — UCAR" },
      { name: "description", content: "Gérez vos informations personnelles et paramètres de sécurité." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const user = useAuthStore((s) => s.user);
  
  const [formData, setFormData] = useState({
    name: user?.name || currentStudent.name,
    email: user?.email || currentStudent.email,
    phone: "+216 22 345 678",
    address: "Résidence Carthage, Tunis",
    bio: "Étudiante en 3ème année Génie Informatique à l'ENIT. Passionnée par le développement web et l'IA.",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus("idle");

    // Simuler une requête SQL UPDATE
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Paramètres"
        title="Mon profil personnel"
        description="Gérez vos informations de contact et vos préférences de sécurité."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne gauche: Avatar & Bio */}
        <div className="lg:col-span-1 space-y-6">
          <Section>
            <div className="text-center py-4">
              <div className="relative inline-block">
                <div className="size-24 rounded-full ucar-gradient-navy flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl ring-4 ring-white">
                  {user?.avatarInitials}
                </div>
                <button className="absolute bottom-0 right-0 size-8 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-navy hover:text-gold transition-colors">
                  <Camera className="size-4" />
                </button>
              </div>
              <h2 className="mt-4 font-display font-bold text-lg">{formData.name}</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                {currentStudent.field} · {user?.institutionName}
              </p>
            </div>
            
            <div className="mt-6 space-y-4 border-t border-border pt-6">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5 block">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full h-24 rounded-lg border border-input bg-background p-3 text-sm outline-none focus:border-gold transition-all resize-none"
                />
              </div>
            </div>
          </Section>

          <Section title="Sécurité" description="Statut du compte">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-success" />
                  <div className="text-xs font-semibold">2FA Activé</div>
                </div>
                <span className="text-[10px] text-success uppercase font-bold tracking-wider">Sécurisé</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <KeyRound className="size-5 text-muted-foreground" />
                  <div className="text-xs font-semibold">Mot de passe</div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase">Modifier</Button>
              </div>
            </div>
          </Section>
        </div>

        {/* Colonne droite: Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Informations Personnelles" description="Détails de contact officiels">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      disabled
                      value={formData.name}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-muted/30 text-sm opacity-70 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 px-1 italic">
                    Modifiable uniquement via l'administration.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Email institutionnel</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      disabled
                      value={formData.email}
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-muted/30 text-sm opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+216 -- --- ---"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Cité, Ville..."
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {saveStatus === "success" && (
                    <div className="flex items-center gap-1.5 text-success text-xs font-bold animate-in fade-in slide-in-from-left-2">
                      <CheckCircle2 className="size-4" />
                      Profil mis à jour
                    </div>
                  )}
                  {saveStatus === "error" && (
                    <div className="flex items-center gap-1.5 text-destructive text-xs font-bold">
                      <AlertCircle className="size-4" />
                      Erreur lors de la sauvegarde
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="gap-2 min-w-[140px]"
                >
                  {isSaving ? (
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </Section>

          <Section title="Informations Académiques" description="Données de scolarité non modifiables">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">ID Étudiant</div>
                <div className="font-mono text-sm font-bold text-navy">{currentStudent.id}</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Semestre Actuel</div>
                <div className="font-mono text-sm font-bold text-navy">S{currentStudent.semester}</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Crédits ECTS</div>
                <div className="font-mono text-sm font-bold text-navy">{currentStudent.credits} / {currentStudent.totalCredits}</div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
