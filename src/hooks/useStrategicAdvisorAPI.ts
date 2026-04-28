const DEFAULT_API_BASE = "http://127.0.0.1:5050/agents/strategic";

export type StrategicAdvisorResponse = {
  success?: boolean;
  report_id?: string;
  report_text?: string;
  report_file?: string;
  pdf_path?: string;
  download_url?: string;
  warnings_count?: number;
  insights_count?: number;
  error?: string;
};

export type StrategicMetrics = {
  overall_success: number;
  budget_utilization: number;
  total_budget: number;
  surplus: number;
  critical_fields: string[];
  top_performing_inst: string;
};

export function useStrategicAdvisorAPI() {
  const evaluate = async (payload?: any): Promise<StrategicAdvisorResponse> => {
    const apiBase = import.meta.env.VITE_STRATEGIC_ADVISOR_API_URL || DEFAULT_API_BASE;
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
      throw new Error(`Strategic Advisor API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const jobId = data.job_id;

    // 2. Poll for the result
    const pollUrl = `${apiBase.replace(/\/+$/, "")}/api/jobs/${jobId}`;
    let result: StrategicAdvisorResponse | null = null;

    for (let i = 0; i < 180; i++) { // Max 180 polls (180 seconds)
      await new Promise((res) => setTimeout(res, 1000));
      const pollRes = await fetch(pollUrl);
      if (!pollRes.ok) continue;
      
      const pollData = await pollRes.json();
      if (pollData.status === "done" && pollData.result) {
        result = pollData.result as StrategicAdvisorResponse;
        if (result.success === false) {
          throw new Error(result.error || "L'agent a rencontré une erreur pendant l'analyse.");
        }
        break;
      } else if (pollData.status === "failed") {
        throw new Error(pollData.result?.error || "Job failed");
      }
    }

    if (!result) {
      throw new Error("Timeout waiting for strategic advisor report.");
    }

    // Format download URL properly if missing prefix
    if (result.download_url && !result.download_url.startsWith('http')) {
      result.download_url = `${apiBase.replace(/\/+$/, "")}${result.download_url}`;
    }

    return result;
  };

  const getMetrics = async (reportId: string): Promise<StrategicMetrics> => {
    const apiBase = import.meta.env.VITE_STRATEGIC_ADVISOR_API_URL || DEFAULT_API_BASE;
    const url = `${apiBase.replace(/\/+$/, "")}/api/reports/${reportId}/metrics`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: HTTP ${response.status}`);
    }
    return response.json();
  };

  return { evaluate, getMetrics };
}
