import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/superadmin/offers")({
  head: () => ({ meta: [{ title: "Offres & Appels — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Super Admin"
      title="Offres & Appels"
      description="Centralisation des appels."
      features={["Appels d'offres publics", "Marchés", "Bourses nationales"]}
    />
  ),
});
