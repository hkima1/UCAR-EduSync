import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuthStore, type Role } from "@/stores/authStore";
import { authenticateUser, validateTotp, MOCK_USERS } from "@/mock/auth";
import { useState, useEffect, useRef } from "react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  KeyRound,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — UCAR · Université de Carthage" },
      {
        name: "description",
        content:
          "Authentification sécurisée à la plateforme UCAR — Université de Carthage.",
      },
    ],
  }),
  component: LoginPage,
});

type Step = "credentials" | "totp" | "loading";

function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [pendingUser, setPendingUser] = useState<ReturnType<typeof authenticateUser>>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const totpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate({ to: routeForRole(user.role) });
    }
  }, [user, navigate]);

  // ── Step 1: Credentials ──
  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    // Simulate: SELECT * FROM users WHERE email = $1 AND password_hash = crypt($2, password_hash)
    const matchedUser = authenticateUser(email, password);

    if (!matchedUser) {
      setError("Email ou mot de passe incorrect.");
      return;
    }

    setPendingUser(matchedUser);

    if (matchedUser.totpEnabled) {
      setStep("totp");
      setTimeout(() => totpRefs.current[0]?.focus(), 100);
    } else {
      completeLogin(matchedUser);
    }
  };

  // ── Step 2: TOTP ──
  const handleTotpInput = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...totpCode];
    newCode[index] = value;
    setTotpCode(newCode);

    if (value && index < 5) {
      totpRefs.current[index + 1]?.focus();
    }
  };

  const handleTotpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !totpCode[index] && index > 0) {
      totpRefs.current[index - 1]?.focus();
    }
  };

  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = totpCode.join("");
    if (code.length !== 6) {
      setError("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    if (!pendingUser) return;

    // Simulate: SELECT 1 FROM user_totp WHERE user_id = $1 AND code = $2
    if (!validateTotp(pendingUser.id, code)) {
      setError("Code de vérification invalide.");
      setTotpCode(["", "", "", "", "", ""]);
      totpRefs.current[0]?.focus();
      return;
    }

    completeLogin(pendingUser);
  };

  const completeLogin = (u: NonNullable<typeof pendingUser>) => {
    setStep("loading");
    // Simulate session creation delay
    setTimeout(() => {
      login({
        id: u.id,
        name: u.name,
        role: u.role,
        institutionId: u.institutionId,
        institutionName: u.institutionName,
        avatarInitials: u.avatarInitials,
        email: u.email,
      });
      navigate({ to: routeForRole(u.role) });
    }, 1200);
  };

  const goBack = () => {
    setStep("credentials");
    setTotpCode(["", "", "", "", "", ""]);
    setError("");
    setPendingUser(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] ucar-gradient-navy relative overflow-hidden flex-col justify-between p-10">
        <div className="absolute inset-0 ucar-grid-bg opacity-30" />
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
            Connexion sécurisée avec authentification à double facteur.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-white/40">
            <ShieldCheck className="size-5 text-gold" />
            <span>Connexion chiffrée SSL · 2FA activé · Session sécurisée</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30">
          © Université de Carthage · v2.0
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="rounded-xl bg-white border border-border p-2 shadow-sm">
              <img src="/UCAR_logo.png" alt="UCAR" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-foreground">Carthage Connect</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Université de Carthage</div>
            </div>
          </div>

          {/* ── STEP: Credentials ── */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialSubmit} className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Connexion</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Authentifiez-vous pour accéder à votre espace UCAR.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Adresse email institutionnelle</label>
                  <div className="relative">
                    <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="prenom.nom@etablissement.utc.tn"
                      className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Mot de passe</label>
                  <div className="relative">
                    <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-10 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="w-full h-11 rounded-lg bg-navy text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors active:scale-[0.98]"
              >
                Continuer
                <ArrowRight className="size-4" />
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-navy transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Demo credentials hint */}
              <div className="mt-6 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <Info className="size-3.5" />
                  <span>{showCredentials ? "Masquer" : "Afficher"} les identifiants de démonstration</span>
                </button>

                {showCredentials && (
                  <div className="mt-3 space-y-2">
                    {MOCK_USERS.map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => { setEmail(u.email); setPassword(u.password); }}
                        className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-navy/30 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold">{u.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{u.email}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy/10 text-navy border border-navy/20 font-medium">
                              {u.role.replace("_", " ")}
                            </span>
                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">2FA: {u.totpSecret}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ── STEP: 2FA / TOTP ── */}
          {step === "totp" && (
            <form onSubmit={handleTotpSubmit} className="space-y-6">
              <div>
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                >
                  ← Retour
                </button>
                <div className="size-14 rounded-xl bg-navy/10 flex items-center justify-center mb-4">
                  <KeyRound className="size-7 text-navy" />
                </div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Vérification 2FA</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Saisissez le code à 6 chiffres de votre application d'authentification.
                </p>
                {pendingUser && (
                  <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border text-xs">
                    <span className="text-muted-foreground">Connecté en tant que :</span>{" "}
                    <span className="font-semibold">{pendingUser.name}</span>
                    <span className="text-muted-foreground ml-2">({pendingUser.email})</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-center gap-3">
                {totpCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { totpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTotpInput(i, e.target.value)}
                    onKeyDown={(e) => handleTotpKeyDown(i, e)}
                    className={cn(
                      "size-12 rounded-lg border text-center text-lg font-display font-bold outline-none transition-all",
                      digit
                        ? "border-navy bg-navy/5 text-navy"
                        : "border-input bg-card text-foreground focus:border-navy focus:ring-2 focus:ring-navy/20"
                    )}
                  />
                ))}
              </div>

              <button
                id="totp-submit"
                type="submit"
                className="w-full h-11 rounded-lg bg-navy text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors active:scale-[0.98]"
              >
                <ShieldCheck className="size-4" />
                Vérifier et se connecter
              </button>

              <div className="text-center text-xs text-muted-foreground">
                Le code expire dans 30 secondes.
              </div>
            </form>
          )}

          {/* ── STEP: Loading ── */}
          {step === "loading" && (
            <div className="text-center py-12">
              <div className="size-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-5">
                <Loader2 className="size-8 text-navy animate-spin" />
              </div>
              <h2 className="font-display text-xl font-bold">Connexion en cours…</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Création de la session sécurisée et chargement de votre espace.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function routeForRole(role: Role): string {
  return {
    student: "/student/dashboard",
    teacher: "/teacher/dashboard",
    institution_admin: "/admin/dashboard",
    director: "/director/dashboard",
    super_admin: "/superadmin/dashboard",
  }[role];
}
