import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { verifyEmail, ApiError } from "@/lib/api";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Vérification Email — UCAR" },
      { name: "description", content: "Vérifiez votre adresse email pour activer votre compte UCAR." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || "",
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = useSearch({ from: "/verify-email" });

  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de vérification manquant dans l'URL.");
      return;
    }

    verifyEmail(token)
      .then((data) => {
        if (data.already_verified) {
          setStatus("already");
        } else {
          setStatus("success");
        }
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof ApiError ? err.message : "Une erreur est survenue.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="rounded-xl bg-white border border-border p-2 shadow-sm">
            <img src="/UCAR_logo.png" alt="UCAR" className="h-10 w-auto object-contain" />
          </div>
          <div>
            <div className="font-display font-bold text-lg text-foreground">Carthage Connect</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Université de Carthage</div>
          </div>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="py-12">
            <div className="size-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-5">
              <Loader2 className="size-8 text-navy animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Vérification en cours…</h1>
            <p className="text-sm text-muted-foreground mt-2">Veuillez patienter pendant que nous vérifions votre email.</p>
          </div>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="py-8">
            <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="size-8 text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-emerald-700">Email vérifié !</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-sm mx-auto">{message}</p>

            <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-center gap-2 text-amber-700 text-sm font-medium mb-1">
                <MailCheck className="size-4" />
                Prochaine étape
              </div>
              <p className="text-xs text-amber-600">
                Votre compte est maintenant en attente d'approbation par l'administration de votre établissement.
                Vous recevrez une notification une fois votre compte activé.
              </p>
            </div>

            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-navy text-white font-medium text-sm px-6 hover:bg-navy/90 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Aller à la connexion
            </Link>
          </div>
        )}

        {/* Already verified */}
        {status === "already" && (
          <div className="py-8">
            <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="size-8 text-blue-500" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Déjà vérifié</h1>
            <p className="text-sm text-muted-foreground mt-3">Votre email a déjà été vérifié. Vous pouvez vous connecter.</p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-navy text-white font-medium text-sm px-6 hover:bg-navy/90 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Se connecter
            </Link>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="py-8">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-5">
              <XCircle className="size-8 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-destructive">Erreur de vérification</h1>
            <p className="text-sm text-muted-foreground mt-3">{message}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-input bg-background text-foreground font-medium text-sm px-6 hover:bg-accent transition-colors"
              >
                Réessayer l'inscription
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-navy text-white font-medium text-sm px-6 hover:bg-navy/90 transition-colors"
              >
                Connexion
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
