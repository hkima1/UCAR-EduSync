import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/superadmin/financial")({
  head: () => ({ meta: [{ title: "Finance Globale — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Super Admin"
      title="Finance Globale"
      description="Budget consolidé des établissements."
      features={["Budget consolidé", "Transferts", "Audit"]}
    />
  ),
});
