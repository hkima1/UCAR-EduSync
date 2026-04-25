import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/superadmin/strategic")({
  head: () => ({ meta: [{ title: "Stratégie & Prospective — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Super Admin"
      title="Stratégie & Prospective"
      description="Plan de développement 2030"
      features={["Plan 2030", "Cartographie des filières", "Insertion pro."]}
    />
  ),
});
