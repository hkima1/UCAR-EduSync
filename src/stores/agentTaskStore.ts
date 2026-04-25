import { create } from "zustand";

export type AgentType =
  | "doc_agent"
  | "notify_agent"
  | "analytics_agent"
  | "workflow_agent";

export type AgentStep = {
  label: string;
  status: "pending" | "running" | "done";
};

export type AgentTask = {
  id: string;
  type: AgentType;
  description: string;
  payload: Record<string, unknown>;
  targetRole?: string;
  status: "pending" | "running" | "done" | "failed";
  steps: AgentStep[];
  result?: { type: "file" | "message" | "data"; content: string };
  createdAt: string;
};

type State = {
  tasks: AgentTask[];
  upsert: (t: AgentTask) => void;
  update: (id: string, patch: Partial<AgentTask>) => void;
};

export const useAgentTaskStore = create<State>((set) => ({
  tasks: [],
  upsert: (t) =>
    set((s) => ({
      tasks: [t, ...s.tasks.filter((x) => x.id !== t.id)],
    })),
  update: (id, patch) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
}));
