import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore, type Role } from "@/stores/authStore";
import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "477350247068-1avukeg5pis4qs1hpkpf3cuc31ua9vhl.apps.googleusercontent.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — UCAR · Université de Carthage" },
      {
        name: "description",
        content: "Authentification sécurisée à la plateforme UCAR — Université de Carthage.",
      },
    ],
  }),
  component: LoginPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────
type GoogleProfile = {
  google_id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};

type Institution = { id: string; institution_name: string };

type Step = "idle" | "loading" | "register" | "pending" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────
function routeForRole(role: Role): string {
  return (
    {
      student:          "/student/dashboard",
      teacher:          "/teacher/dashboard",
      institution_admin:"/admin/dashboard",
      director:         "/director/dashboard",
      super_admin:      "/superadmin/dashboard",
      ucar_admin:       "/superadmin/dashboard",
    }[role] ?? "/"
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
function LoginPage() {
  const user       = useAuthStore((s) => s.user);
  const loginStore = useAuthStore((s) => s.login);
  const navigate   = useNavigate();

  const [step,          setStep]          = useState<Step>("idle");
  const [error,         setError]         = useState("");
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null);
  const [institutions,  setInstitutions]  = useState<Institution[]>([]);
  const [regForm,       setRegForm]       = useState({ institution_id: "", role_name: "student" });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate({ to: routeForRole(user.role) });
  }, [user, navigate]);

  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Fetch institutions list for registration form
  useEffect(() => {
    fetch(`${API_BASE}/institutions`)
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.institutions)) setInstitutions(data.institutions);
        else if (Array.isArray(data)) setInstitutions(data);
        else setInstitutions([]);
      })
      .catch(() => setInstitutions([]));
  }, []);

  // ── Google callback ────────────────────────────────────────────────────────
  const handleGoogleCredential = useCallback(async (response: { credential: string }) => {
    setStep("loading");
    setError("");

    try {
      const res  = await fetch(`${API_BASE}/auth/google`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();

      // ── New user: show registration form ──────────────────────────────
      if (data.needs_registration) {
        setGoogleProfile(data.google_profile);
        setStep("register");
        return;
      }

      // ── Pending approval ──────────────────────────────────────────────
      if (!res.ok && data.code === "PENDING_APPROVAL") {
        setStep("pending");
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Erreur d'authentification.");
      }

      // ── Successful login ──────────────────────────────────────────────
      localStorage.setItem("ucar-access-token",  data.access_token);
      localStorage.setItem("ucar-refresh-token", data.refresh_token);

      setStep("loading");
      setTimeout(() => {
        loginStore({
          id:              data.user.id,
          name:            data.user.name,
          email:           data.user.email,
          role:            data.user.role as Role,
          institutionId:   data.user.institutionId,
          institutionName: data.user.institutionName,
          avatarInitials:  data.user.avatarInitials,
          picture:         data.user.picture,
        });
        navigate({ to: routeForRole(data.user.role as Role) });
      }, 600);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setStep("error");
    }
  }, [loginStore, navigate]);

  // ── Initialize Google Identity Services ───────────────────────────────────
  function initGoogle() {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  handleGoogleCredential,
      cancel_on_tap_outside: false,
    });
    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-btn")!,
      { theme: "filled_blue", size: "large", width: 320, locale: "fr" },
    );
    window.google.accounts.id.prompt();
  }

  // ── Registration submit ───────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleProfile || !regForm.institution_id) return;
    setStep("loading");

    try {
      const res  = await fetch(`${API_BASE}/auth/google/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          google_id:      googleProfile.google_id,
          email:          googleProfile.email,
          name:           googleProfile.name,
          given_name:     googleProfile.given_name,
          family_name:    googleProfile.family_name,
          institution_id: regForm.institution_id,
          role_name:      regForm.role_name,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setStep("pending");

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
      setStep("error");
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div 
      className="min-h-screen flex bg-cover bg-center relative"
      style={{ backgroundImage: "url('/landing-bg.jpg')" }}
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-navy/80 mix-blend-multiply" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10 z-10">
        <div className="absolute -bottom-32 -right-32 size-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-20 -left-20 size-[400px] rounded-full bg-gold/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white p-2.5 shadow-lg">
              <img src="/UCAR_logo.png" alt="UCAR" className="h-14 w-auto object-contain" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-white tracking-tight">
                Carthage Connect
              </div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">
                Université de Carthage
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            Plateforme intelligente de pilotage universitaire
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            Gestion académique, financière et stratégique de plus de 30 établissements.
            Connexion sécurisée via votre compte Google institutionnel.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/40">
            <ShieldCheck className="size-5 text-gold" />
            <span>Connexion chiffrée SSL · Google SSO · Session sécurisée</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30">
          © Université de Carthage · v3.0
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 z-10">
        <div className="w-full max-w-md bg-background/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold via-gold/50 to-transparent" />

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="rounded-xl bg-white border border-border p-2 shadow-sm">
              <img src="/UCAR_logo.png" alt="UCAR" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="font-display font-bold text-lg">Carthage Connect</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Université de Carthage</div>
            </div>
          </div>

          {/* ── IDLE / SIGNIN ── */}
          {(step === "idle" || step === "error") && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Connexion</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Utilisez votre compte Google institutionnel UCAR pour vous connecter.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Google button injected here */}
              <div className="flex justify-center">
                <div id="google-signin-btn" />
              </div>

              <p className="text-center text-xs text-muted-foreground">
                En vous connectant, vous acceptez les conditions d'utilisation de la plateforme UCAR.
              </p>
            </div>
          )}

          {/* ── LOADING ── */}
          {step === "loading" && (
            <div className="text-center py-12">
              <div className="size-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="size-8 text-navy animate-spin" />
              </div>
              <h2 className="font-display text-xl font-bold">Connexion en cours…</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Vérification de vos identifiants Google.
              </p>
            </div>
          )}

          {/* ── PENDING APPROVAL ── */}
          {step === "pending" && (
            <div className="text-center py-12 space-y-4">
              <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                <ShieldCheck className="size-8 text-amber-600" />
              </div>
              <h2 className="font-display text-xl font-bold">Compte en attente</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Votre inscription a été reçue. Un administrateur UCAR doit approuver votre compte avant que vous puissiez vous connecter.
              </p>
              <button
                onClick={() => setStep("idle")}
                className="text-xs text-navy underline underline-offset-2 hover:opacity-80"
              >
                Retour à l'accueil
              </button>
            </div>
          )}

          {/* ── REGISTRATION FORM ── */}
          {step === "register" && googleProfile && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Finaliser l'inscription</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Bienvenue <strong>{googleProfile.given_name}</strong> ! Complétez votre profil pour rejoindre la plateforme UCAR.
                </p>
              </div>

              {/* Google profile preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                {googleProfile.picture && (
                  <img src={googleProfile.picture} alt="" className="size-10 rounded-full object-cover" />
                )}
                <div>
                  <div className="text-sm font-semibold">{googleProfile.name}</div>
                  <div className="text-xs text-muted-foreground">{googleProfile.email}</div>
                </div>
              </div>

              {/* Institution */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Établissement</label>
                <select
                  required
                  value={regForm.institution_id}
                  onChange={(e) => setRegForm((f) => ({ ...f, institution_id: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                >
                  <option value="">Sélectionner un établissement…</option>
                  {(institutions || []).map((i) => (
                    <option key={i.id} value={i.id}>{i.institution_name}</option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rôle</label>
                <select
                  value={regForm.role_name}
                  onChange={(e) => setRegForm((f) => ({ ...f, role_name: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                >
                  <option value="student">Étudiant</option>
                  <option value="teacher">Enseignant</option>
                  <option value="institution_admin">Admin établissement</option>
                  <option value="director">Directeur</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-navy text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors"
              >
                Soumettre la demande d'accès
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Votre compte sera activé après validation par l'administration UCAR.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

// Extend Window for GIS types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}
