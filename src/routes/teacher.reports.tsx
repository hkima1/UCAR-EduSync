import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/teacher/reports")({
  head: () => ({ meta: [{ title: "Rapports Pédagogiques — UCAR" }] }),
  component: () => (
    <StubPage
      eyebrow="Enseignant"
      title="Rapports Pédagogiques"
      description="Génération de bulletins et statistiques de classe en cours de développement."
      features={["Génération de bulletins", "Statistiques de classe", "Exports PDF"]}
    />
  ),
});
