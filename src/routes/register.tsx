import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { register, getInstitutions, getRoles, ApiError } from "@/lib/api";
import type { Institution, RoleItem } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Inscription — UCAR · Université de Carthage" },
      {
        name: "description",
        content: "Créez votre compte sur la plateforme UCAR.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  // Form state
  const [username, setUsername] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [institutionId, setInstitutionId] = useState("");
  const [roleName, setRoleName] = useState("student");

  // Data
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);

  // UI state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState("");

  // Load institutions and roles
  useEffect(() => {
    getInstitutions()
      .then((data) => setInstitutions(data.institutions))
      .catch(() => setError("Impossible de charger les institutions."));
    getRoles()
      .then((data) => setRoles(data.roles))
      .catch(() => {});
  }, []);

  // Password strength
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !nom || !prenom || !email || !telephone || !password || !institutionId) {
      setError("Veuillez remplir tous les champs, y compris le numéro de téléphone.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (passwordStrength < 5) {
      setError("Le mot de passe ne respecte pas les critères de sécurité.");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        username,
        nom,
        prenom,
        email,
        telephone,
        password,
        institution_id: institutionId,
        role_name: roleName,
      });
      setVerificationUrl(result.verification_url);
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Role labels for display
  const roleLabels: Record<string, string> = {
    student: "Étudiant(e)",
    teacher: "Enseignant(e)",
    institution_admin: "Administrateur d'établissement",
    director: "Directeur",
    ucar_admin: "Administrateur UCAR",
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
            Rejoignez la communauté universitaire
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed">
            Créez votre compte pour accéder à l'ensemble des services de la plateforme UCAR.
            Votre inscription sera validée par l'administration de votre établissement.
          </p>
          <div className="mt-8 space-y-3 text-sm text-white/40">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-gold shrink-0" />
              <span>Vérification email automatique</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-gold shrink-0" />
              <span>Approbation institutionnelle sécurisée</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-gold shrink-0" />
              <span>Authentification à double facteur</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/30">
          © Université de Carthage · v2.0
        </div>
      </div>

      {/* Right panel — registration form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="rounded-xl bg-white border border-border p-2 shadow-sm">
              <img src="/UCAR_logo.png" alt="UCAR" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-foreground">Carthage Connect</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Université de Carthage</div>
            </div>
          </div>

          {success ? (
            /* ── Success State ── */
            <div className="text-center py-8">
              <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="size-8 text-emerald-500" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Inscription réussie !</h1>
              <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">
                Un email de vérification a été envoyé à <span className="font-semibold text-foreground">{email}</span>.
                Veuillez cliquer sur le lien pour activer votre compte.
              </p>

              {/* Dev only: show verification link */}
              {verificationUrl && (
                <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-left">
                  <div className="text-xs font-semibold text-amber-700 mb-1">🔧 DEV — Lien de vérification :</div>
                  <a
                    href={verificationUrl}
                    className="text-xs text-amber-600 hover:text-amber-800 break-all underline"
                  >
                    {verificationUrl}
                  </a>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Après vérification, votre compte sera soumis à l'approbation de votre administration.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-navy text-white font-medium text-sm px-6 hover:bg-navy/90 transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            /* ── Registration Form ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">Créer un compte</h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Remplissez le formulaire pour vous inscrire sur la plateforme UCAR.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Prénom */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Prénom</label>
                  <div className="relative">
                    <User className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="register-prenom"
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Faouzi"
                      className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                    />
                  </div>
                </div>

                {/* Nom */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom</label>
                  <input
                    id="register-nom"
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    placeholder="Marzouki"
                    className="w-full h-11 rounded-lg border border-input bg-card pl-3 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nom d'utilisateur</label>
                <div className="relative">
                  <span className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 text-sm">@</span>
                  <input
                    id="register-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    placeholder="faouzi.marzouki"
                    className="w-full h-11 rounded-lg border border-input bg-card pl-8 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email institutionnel</label>
                <div className="relative">
                  <Mail className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="prenom.nom@etablissement.utc.tn"
                    className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                </div>
              </div>

              {/* Telephone */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-telephone"
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+216 20 123 456"
                    className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                </div>
              </div>

              {/* Institution */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Établissement</label>
                <div className="relative">
                  <Building2 className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="register-institution"
                    value={institutionId}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Sélectionnez votre établissement</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.institution_name} — {inst.location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rôle</label>
                <div className="relative">
                  <ShieldCheck className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="register-role"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-card pl-10 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all appearance-none cursor-pointer"
                  >
                    {roles
                      .filter((r) => ['student', 'teacher'].includes(r.role_name))
                      .map((r) => (
                        <option key={r.id} value={r.role_name}>
                          {roleLabels[r.role_name] || r.role_name}
                        </option>
                      ))}
                  </select>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Seuls les rôles étudiant et enseignant sont disponibles à l'inscription.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mot de passe</label>
                <div className="relative">
                  <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
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

                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-colors",
                            passwordStrength >= level
                              ? passwordStrength <= 2
                                ? "bg-red-500"
                                : passwordStrength <= 3
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(passwordChecks).map(([key, valid]) => (
                        <div
                          key={key}
                          className={cn(
                            "text-[10px] flex items-center gap-1",
                            valid ? "text-emerald-600" : "text-muted-foreground"
                          )}
                        >
                          <span>{valid ? "✓" : "○"}</span>
                          {{
                            length: "8+ caractères",
                            uppercase: "Majuscule",
                            lowercase: "Minuscule",
                            number: "Chiffre",
                            special: "Spécial (@$!%*?&)",
                          }[key]}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••"
                    className={cn(
                      "w-full h-11 rounded-lg border bg-card pl-10 pr-3 text-sm outline-none focus:ring-2 transition-all",
                      confirmPassword && confirmPassword !== password
                        ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                        : "border-input focus:border-navy focus:ring-navy/20"
                    )}
                  />
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-destructive mt-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-navy text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-navy/90 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Inscription en cours…
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    S'inscrire
                  </>
                )}
              </button>

              {/* Login link */}
              <div className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link
                  to="/"
                  className="text-navy hover:text-navy/80 font-medium transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
