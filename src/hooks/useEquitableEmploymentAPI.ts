import { toText } from "./useAcademicAdvisorAPI";

const DEFAULT_API_BASE = "http://127.0.0.1:5050/agents/employment";

export type EmploymentAdvisorResponse = {
  success?: boolean;
  report_id?: string;
  report_text?: string;
  warnings_count?: number;
  actions_count?: number;
  error?: string;
};

export type EmploymentReportMeta = {
  report_id: string;
  filename: string;
  size_bytes: number;
  created_at: number;
};

export function useEquitableEmploymentAPI() {
  const evaluate = async (payload?: any): Promise<EmploymentAdvisorResponse> => {
    const apiBase = import.meta.env.VITE_EMPLOYMENT_ADVISOR_API_URL || DEFAULT_API_BASE;
    const url = payload 
      ? `${apiBase.replace(/\/+$/, "")}/api/analyze` 
      : `${apiBase.replace(/\/+$/, "")}/api/analyze/sample`;

    // 1. Submit the task
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Employment Advisor API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const jobId = data.job_id;

    // 2. Poll for the result
    const pollUrl = `${apiBase.replace(/\/+$/, "")}/api/jobs/${jobId}`;
    let result: EmploymentAdvisorResponse | null = null;

    for (let i = 0; i < 180; i++) { // Max 180 polls (180 seconds)
      await new Promise((res) => setTimeout(res, 1000));
      const pollRes = await fetch(pollUrl);
      if (!pollRes.ok) continue;
      
      const pollData = await pollRes.json();
      if (pollData.status === "done" && pollData.result) {
        result = pollData.result as EmploymentAdvisorResponse;
        break;
      } else if (pollData.status === "failed") {
        throw new Error(pollData.result?.error || "Job failed");
      }
    }

    if (!result) {
      throw new Error("Timeout waiting for employment advisor report.");
    }

    return result;
  };

  const evaluateAsMarkdown = async (payload?: any): Promise<string> => {
    try {
      const data = await evaluate(payload);
      if (data.report_text) {
        return data.report_text;
      }
      return "Aucun rapport généré.";
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      return `**Erreur:** ${message}`;
    }
  };

  const getReports = async (): Promise<EmploymentReportMeta[]> => {
    const apiBase = import.meta.env.VITE_EMPLOYMENT_ADVISOR_API_URL || DEFAULT_API_BASE;
    const url = `${apiBase.replace(/\/+$/, "")}/api/reports`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.reports || [];
  };

  const getReportById = async (reportId: string): Promise<string> => {
    const apiBase = import.meta.env.VITE_EMPLOYMENT_ADVISOR_API_URL || DEFAULT_API_BASE;
    const url = `${apiBase.replace(/\/+$/, "")}/api/reports/${reportId}?format=text`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Report not found");
    return await response.text();
  };

  return { evaluate, evaluateAsMarkdown, getReports, getReportById };
}
