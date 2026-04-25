import { supabase } from "@/integrations/supabase/client";

export type ChatMsg = { role: "user" | "assistant"; content: string };

/**
 * Claude-style hook signature, but routed through the Lovable AI Gateway
 * via the `ai-chat` edge function. No browser API key.
 */
export function useClaudeAPI() {
  const query = async (
    userMessage: string,
    systemPrompt: string,
    history: ChatMsg[] = [],
  ): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          system: systemPrompt,
          messages: [...history, { role: "user", content: userMessage }],
        },
      });
      if (error) throw error;
      const text = data?.content?.[0]?.text;
      if (typeof text !== "string") throw new Error("Empty AI response");
      return text;
    } catch (e) {
      console.error("useClaudeAPI error:", e);
      // Graceful fallback so the demo never collapses
      return (
        "_(Mode dégradé)_ L'assistant IA est temporairement indisponible. " +
        "Voici un résumé générique basé sur la page courante. " +
        "Veuillez réessayer dans quelques instants."
      );
    }
  };

  return { query };
}
