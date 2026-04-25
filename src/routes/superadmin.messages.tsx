import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/superadmin/messages")({
  head: () => ({ meta: [{ title: "Messages Globaux — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Super Admin"
      title="Messages Globaux"
      description="Communication réseau."
      features={["Alertes de sécurité", "Réseau global"]}
    />
  ),
});
