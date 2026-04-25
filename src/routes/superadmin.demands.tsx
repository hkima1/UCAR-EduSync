import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/superadmin/demands")({
  head: () => ({ meta: [{ title: "Demandes & Requêtes — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Super Admin"
      title="Demandes & Requêtes"
      description="Recours et plaintes au niveau de l'université."
      features={["Recours", "Plaintes", "Requêtes inter-universitaires"]}
    />
  ),
});
