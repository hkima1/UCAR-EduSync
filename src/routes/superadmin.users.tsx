import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/superadmin/users")({
  head: () => ({ meta: [{ title: "Gestion des Utilisateurs — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Super Admin"
      title="Gestion des Utilisateurs"
      description="Gestion des rôles UCAR."
      features={["Annuaire central", "Rôles & Permissions", "Sécurité"]}
    />
  ),
});
