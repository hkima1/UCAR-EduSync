const DEFAULT_API_BASE = "http://127.0.0.1:5050/agents/legal";

export type LegalDocumentResponse = {
  success?: boolean;
  message?: string;
  document_type?: string;
  download_url?: string;
  error?: string;
};

export function useLegalDocumentAPI() {
  const generateDocument = async (studentId: string = "A-002"): Promise<string> => {
    const apiBase = import.meta.env.VITE_LEGAL_AGENT_API_URL || DEFAULT_API_BASE;
    const url = `${apiBase.replace(/\/+$/, "")}/api/generate`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Legal API error: HTTP ${response.status}`);
    }

    const data: LegalDocumentResponse = await response.json();
    
    if (data.download_url) {
      return `${apiBase.replace(/\/+$/, "")}${data.download_url.replace('/api/', '/api/')}`;
    }
    
    throw new Error("No download URL returned from API");
  };

  return { generateDocument };
}
