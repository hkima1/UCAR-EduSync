type AcademicAdvisorResponse = Record<string, unknown>;

const DEFAULT_API_BASE = "http://127.0.0.1:5050/agents/academic";
const DEFAULT_STUDENT_ID = "B-1002";

function buildAdviseUrl(apiBase: string) {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  if (normalizedBase.endsWith("/api/advise")) return normalizedBase;
  return `${normalizedBase}/api/advise`;
}

function resolveStudentId(studentId?: string) {
  if (!studentId) return DEFAULT_STUDENT_ID;
  const normalized = studentId.trim();
  if (!normalized) return DEFAULT_STUDENT_ID;
  // Map local demo IDs (s1, s2...) to the advisor API's unified IDs.
  if (/^s\d+$/i.test(normalized)) return DEFAULT_STUDENT_ID;
  return normalized;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return `- ${item}`;
        if (item && typeof item === "object") {
          return `- ${JSON.stringify(item)}`;
        }
        return `- ${String(item)}`;
      })
      .join("\n");
  }
  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value ?? "");
}

function formatAdviceMarkdown(advice: AcademicAdvisorResponse) {
  const blocks: string[] = [];

  const title =
    (typeof advice.title === "string" && advice.title) ||
    (typeof advice.summary === "string" && "Recommandation académique") ||
    "Conseil académique personnalisé";

  blocks.push(`## ${title}`);

  if (advice.summary) {
    blocks.push("### Résumé");
    blocks.push(toText(advice.summary));
  }

  if (advice.recommendations) {
    blocks.push("### Recommandations");
    blocks.push(toText(advice.recommendations));
  }

  if (advice.next_steps) {
    blocks.push("### Prochaines étapes");
    blocks.push(toText(advice.next_steps));
  }

  if (advice.risks) {
    blocks.push("### Risques à surveiller");
    blocks.push(toText(advice.risks));
  }

  if (blocks.length <= 1) {
    blocks.push("### Réponse brute");
    blocks.push("```json");
    blocks.push(JSON.stringify(advice, null, 2));
    blocks.push("```");
  }

  return blocks.join("\n\n");
}

export function useAcademicAdvisorAPI() {
  const advise = async (studentId?: string): Promise<AcademicAdvisorResponse> => {
    const apiBase = import.meta.env.VITE_ACADEMIC_ADVISOR_API_URL || DEFAULT_API_BASE;
    const resolvedStudentId = resolveStudentId(studentId);

    const response = await fetch(buildAdviseUrl(apiBase), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_id: resolvedStudentId }),
    });

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        const errorText = typeof body?.error === "string" ? body.error : JSON.stringify(body);
        detail = `${detail} - ${errorText}`;
      } catch {
        // Keep fallback HTTP status detail.
      }
      throw new Error(`Academic advisor API error: ${detail}`);
    }

    return (await response.json()) as AcademicAdvisorResponse;
  };

  const adviseAsMarkdown = async (studentId?: string): Promise<string> => {
    const data = await advise(studentId);
    return formatAdviceMarkdown(data);
  };

  return { advise, adviseAsMarkdown };
}
