import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore, type Role } from "@/stores/authStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Connexion — UCAR" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const loginAs = useAuthStore((s) => s.loginAs);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate({ to: routeForRole(user.role) });
    }
  }, [user, navigate]);

  const roles: Role[] = [
    "student",
    "teacher",
    "institution_admin",
    "director",
    "super_admin",
    "ucar_admin",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5">
        <h1 className="text-2xl font-display font-bold">Connexion rapide</h1>
        <p className="text-sm text-muted-foreground">
          Version dégradée temporaire après résolution de conflit Git. Sélectionnez un rôle pour entrer dans l'application.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <Button
              key={role}
              variant="outline"
              className="justify-start"
              onClick={() => loginAs(role)}
            >
              {role.replace("_", " ")}
            </Button>
          ))}
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
    ucar_admin: "/superadmin/dashboard",
  }[role] || "/";
}
