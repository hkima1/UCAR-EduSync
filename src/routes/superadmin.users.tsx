import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageHeader, Section } from "@/components/ui/page-primitives";
import {
  CheckCircle2, XCircle, Clock, Search, RefreshCw,
  Mail, Building2, UserCircle2, ShieldCheck, AlertCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

export const Route = createFileRoute("/superadmin/users")({
  head: () => ({ meta: [{ title: "Gestion des Utilisateurs — UCAR" }] }),
  component: SuperAdminUsers,
});

// ── Types ─────────────────────────────────────────────────────────────────────
type PendingUser = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  created_at: string;
  role_name: string;
  institution_name: string;
};

type ActionState = { [id: string]: "loading" | "approved" | "rejected" | null };

// ── Helpers ───────────────────────────────────────────────────────────────────
function roleBadge(role: string) {
  const map: Record<string, string> = {
    student: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    teacher: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    institution_admin: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    director: "bg-navy/10 text-navy border-navy/20",
  };
  const labels: Record<string, string> = {
    student: "Étudiant",
    teacher: "Enseignant",
    institution_admin: "Admin",
    director: "Directeur",
  };
  return { cls: map[role] ?? "bg-muted text-muted-foreground border-border", label: labels[role] ?? role };
}

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs}h`;
  return `il y a ${Math.floor(hrs / 24)}j`;
}

function initials(prenom: string, nom: string) {
  return `${(prenom?.[0] ?? "").toUpperCase()}${(nom?.[0] ?? "").toUpperCase()}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
function SuperAdminUsers() {
  const [users,      setUsers]     = useState<PendingUser[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState("");
  const [search,     setSearch]    = useState("");
  const [actions,    setActions]   = useState<ActionState>({});
  const [toast,      setToast]     = useState("");

  const token = localStorage.getItem("ucar-access-token") ?? "";

  // ── Fetch pending users ───────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`${API_BASE}/auth/pending-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setUsers(data.pending ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Approve / Reject ──────────────────────────────────────────────────────
  const handleAction = async (user_id: string, action: "approved" | "rejected") => {
    setActions((a) => ({ ...a, [user_id]: "loading" }));
    try {
      const res  = await fetch(`${API_BASE}/auth/approve-user`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ user_id, action }),
      });
      if (!res.ok) throw new Error();
      setActions((a) => ({ ...a, [user_id]: action }));
      setToast(action === "approved" ? "✅ Compte approuvé avec succès." : "❌ Compte refusé.");
      setTimeout(() => {
        setToast("");
        setUsers((u) => u.filter((x) => x.id !== user_id));
        setActions((a) => { const n = { ...a }; delete n[user_id]; return n; });
      }, 1800);
    } catch {
      setActions((a) => ({ ...a, [user_id]: null }));
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.prenom} ${u.nom}`.toLowerCase().includes(q) ||
      u.institution_name?.toLowerCase().includes(q) ||
      u.role_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin · UCAR"
        title="Gestion des Utilisateurs"
        description="Approuvez ou refusez les demandes d'accès reçues via Google Sign-In."
        actions={
          <Button variant="outline" className="gap-2" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Actualiser
          </Button>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "En attente", value: users.length, icon: Clock, color: "text-amber-500" },
          { label: "Approuvés aujourd'hui", value: Object.values(actions).filter((v) => v === "approved").length, icon: CheckCircle2, color: "text-success" },
          { label: "Refusés aujourd'hui", value: Object.values(actions).filter((v) => v === "rejected").length, icon: XCircle, color: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
            <s.icon className={cn("size-8 shrink-0", s.color)} />
            <div>
              <div className="text-2xl font-display font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Section title="Demandes en attente d'approbation" description="Utilisateurs authentifiés via Google en attente de validation">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, institution…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-input bg-background text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
          />
        </div>

        {/* States */}
        {loading && (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-navy" />
            <span className="text-sm">Chargement des demandes…</span>
          </div>
        )}

        {!loading && error && (
          <div className="py-10 flex flex-col items-center gap-3">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchUsers}>Réessayer</Button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <ShieldCheck className="size-10 text-success" />
            <p className="text-sm font-medium">
              {users.length === 0 ? "Aucune demande en attente." : "Aucun résultat pour cette recherche."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((u) => {
              const st = actions[u.id];
              const badge = roleBadge(u.role_name);
              return (
                <div
                  key={u.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all",
                    st === "approved" ? "border-success/40 bg-success/5 opacity-60" :
                    st === "rejected" ? "border-destructive/40 bg-destructive/5 opacity-60" :
                    "border-border bg-muted/20 hover:border-gold/30",
                  )}
                >
                  {/* Avatar + Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-11 rounded-full bg-navy/10 border-2 border-navy/20 flex items-center justify-center text-sm font-bold text-navy shrink-0">
                      {initials(u.prenom, u.nom)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {u.prenom} {u.nom}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Mail className="size-3 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase tracking-wide", badge.cls)}>
                      {badge.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Building2 className="size-3" />
                      {u.institution_name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      {timeAgo(u.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {st === "loading" && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
                    {st === "approved" && <span className="text-xs text-success font-medium flex items-center gap-1"><CheckCircle2 className="size-4" />Approuvé</span>}
                    {st === "rejected" && <span className="text-xs text-destructive font-medium flex items-center gap-1"><XCircle className="size-4" />Refusé</span>}
                    {!st && (
                      <>
                        <button
                          onClick={() => handleAction(u.id, "rejected")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
                        >
                          <XCircle className="size-3.5" /> Refuser
                        </button>
                        <button
                          onClick={() => handleAction(u.id, "approved")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy/90 transition-colors"
                        >
                          <CheckCircle2 className="size-3.5" /> Approuver
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-card border border-border shadow-xl text-sm font-medium animate-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}
    </div>
  );
}
