export type ScholarshipAdvisorResponse = Record<string, unknown> & {
  download_url?: string;
  pdf_path?: string;
};

const DEFAULT_API_BASE = "http://127.0.0.1:5050/agents/scholarship";
const DEFAULT_STUDENT_ID = "A-002"; // Hardcoded as requested to A-002 for the agent API

function buildAdviseUrl(apiBase: string) {
  const normalizedBase = apiBase.replace(/\/+$/, "");
  if (normalizedBase.endsWith("/api/recommendation")) return normalizedBase;
  return `${normalizedBase}/api/recommendation`;
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

export function formatScholarshipMarkdown(advice: ScholarshipAdvisorResponse) {
  const blocks: string[] = [];

  const title =
    (typeof advice.title === "string" && advice.title) ||
    "Recommandations de Bourses et Stages";

  blocks.push(`## ${title}`);

  if (advice.summary || advice.advice_summary) {
    blocks.push("### Résumé du profil");
    blocks.push(toText(advice.summary || advice.advice_summary));
  }

  if (Array.isArray(advice.recommended_programs) && advice.recommended_programs.length > 0) {
    blocks.push("### Opportunités recommandées");
    const progs = advice.recommended_programs.map((p: any) => 
      `- **${p.title}** (${p.category})\n  *Score de correspondance: ${(p.match_score * 100).toFixed(1)}%*\n  ${p.reason}`
    ).join("\n");
    blocks.push(progs);
  }
  
  if (advice.next_steps) {
    blocks.push("### Prochaines démarches");
    blocks.push(toText(advice.next_steps));
  }

  if (blocks.length <= 1) {
    blocks.push("### Réponse brute");
    blocks.push("```json");
    const safeAdvice = { ...advice };
    delete safeAdvice.error;
    blocks.push(JSON.stringify(safeAdvice, null, 2));
    blocks.push("```");
  }

  return blocks.join("\n\n");
}

export function useScholarshipAdvisorAPI() {
  const advise = async (studentId?: string): Promise<ScholarshipAdvisorResponse> => {
    const apiBase = import.meta.env.VITE_SCHOLARSHIP_ADVISOR_API_URL || DEFAULT_API_BASE;
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
      throw new Error(`Scholarship advisor API error: ${detail}`);
    }

    let data = (await response.json()) as ScholarshipAdvisorResponse;
    if (data.download_url && !data.download_url.startsWith('http')) {
      data.download_url = `${apiBase.replace(/\/+$/, "")}${data.download_url}`;
    }
    return data;
  };

  const adviseAsMarkdown = async (studentId?: string): Promise<string> => {
    const data = await advise(studentId);
    return formatScholarshipMarkdown(data);
  };

  return { advise, adviseAsMarkdown };
}
