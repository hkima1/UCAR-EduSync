import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/ui/stub-page";

export const Route = createFileRoute("/teacher/messages")({
  head: () => ({ meta: [{ title: "Messages — UCAR" }, { name: "description", content: "Communication avec étudiants et collègues." }] }),
  component: () => (
    <StubPage
      eyebrow="Enseignant"
      title="Messages"
      description="Communication avec étudiants et collègues."
      features={["Inbox","Discussions étudiants","Groupes pédagogiques","Recherche"]}
    />
  ),
});
