import { useCallback } from "react";
import {
  useAgentTaskStore,
  type AgentTask,
  type AgentType,
} from "@/stores/agentTaskStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useClaudeAPI } from "./useClaudeAPI";

const STEPS: Record<AgentType, string[]> = {
  doc_agent: [
    "Classification de la requête",
    "Récupération des données",
    "Génération du contenu",
    "Mise en forme PDF",
    "Livraison à l'utilisateur",
  ],
  notify_agent: [
    "Identification des destinataires",
    "Composition de la notification",
    "Routage selon le rôle cible",
    "Livraison",
  ],
  analytics_agent: [
    "Collecte des données centralisées",
    "Exécution de l'analyse",
    "Appel du modèle IA",
    "Compilation des résultats",
  ],
  workflow_agent: [
    "Validation de la requête",
    "Création de la chaîne d'approbation",
    "Notification des parties prenantes",
    "Attente des réponses",
  ],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min) + min);

export function useAgentTask() {
  const upsert = useAgentTaskStore((s) => s.upsert);
  const update = useAgentTaskStore((s) => s.update);
  const notify = useNotificationStore((s) => s.add);
  const { query } = useClaudeAPI();

  const submitTask = useCallback(
    async (config: {
      type: AgentType;
      description: string;
      payload?: Record<string, unknown>;
      targetRole?: string;
      requiresAI?: boolean;
      aiSystem?: string;
      aiPrompt?: string;
      externalRun?: () => Promise<string>;
    }) => {
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const stepLabels = STEPS[config.type];
      const task: AgentTask = {
        id,
        type: config.type,
        description: config.description,
        payload: config.payload ?? {},
        targetRole: config.targetRole,
        status: "running",
        steps: stepLabels.map((label) => ({ label, status: "pending" })),
        createdAt: new Date().toISOString(),
      };
      upsert(task);

      try {
        let aiResult: string | undefined;
        for (let i = 0; i < stepLabels.length; i++) {
          update(id, {
            steps: stepLabels.map((label, idx) => ({
              label,
              status: idx < i ? "done" : idx === i ? "running" : "pending",
            })),
          });
          // AI call happens at "Appel du modèle IA" step for analytics_agent,
          // or at "Génération du contenu" for doc_agent if requiresAI
          const isAIStep =
            (config.type === "analytics_agent" && i === 2) ||
            (config.type === "doc_agent" && i === 2);
          if (isAIStep && config.externalRun) {
            aiResult = await config.externalRun();
          } else if (isAIStep && config.requiresAI && config.aiPrompt) {
            aiResult = await query(
              config.aiPrompt,
              config.aiSystem ?? "Tu es un assistant analytique pour UCAR.",
            );
          } else {
            await wait(rand(300, 900));
          }
        }
        update(id, {
          status: "done",
          steps: stepLabels.map((label) => ({ label, status: "done" })),
          result:
            config.type === "doc_agent"
              ? {
                  type: "file",
                  content: aiResult ?? "Document généré (PDF simulé).",
                }
              : config.type === "analytics_agent"
                ? { type: "data", content: aiResult ?? "Analyse terminée." }
                : { type: "message", content: "Opération effectuée." },
        });
        notify({
          type: "task",
          priority: "info",
          title: `Agent terminé : ${config.description}`,
          body: "Consultez le résultat dans l'onglet Agents.",
        });
        return id;
      } catch (e) {
        update(id, { status: "failed" });
        notify({
          type: "alert",
          priority: "warning",
          title: "Échec d'un agent",
          body: config.description,
        });
        return id;
      }
    },
    [upsert, update, notify, query],
  );

  return { submitTask };
}
