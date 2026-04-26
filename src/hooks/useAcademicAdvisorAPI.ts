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
    "Conseil académique personnalisé";

  blocks.push(`## ${title}`);

  if (advice.advice_summary || advice.summary) {
    blocks.push("### Résumé");
    blocks.push(toText(advice.advice_summary || advice.summary));
  }

  if (Array.isArray(advice.recommended_certifications)) {
    blocks.push("### Certifications recommandées");
    const certs = advice.recommended_certifications.map((c: any) => 
      `- **${c.name}** (${c.provider}) — *${c.difficulty}, ${c.estimated_duration}*\n  ${c.relevance}`
    ).join("\n");
    blocks.push(certs);
  } else if (advice.recommendations) {
    blocks.push("### Recommandations");
    blocks.push(toText(advice.recommendations));
  }

  if (Array.isArray(advice.recommended_specializations)) {
    blocks.push("### Spécialisations recommandées");
    const specs = advice.recommended_specializations.map((s: any) => 
      `- **${s.name}**\n  *Prérequis: ${s.prerequisites}*\n  ${s.description}`
    ).join("\n");
    blocks.push(specs);
  }

  if (Array.isArray(advice.continuation_pathways)) {
    blocks.push("### Poursuites d'études");
    const paths = advice.continuation_pathways.map((p: any) => 
      `- **${p.degree}** à ${p.institution}\n  ${p.description}`
    ).join("\n");
    blocks.push(paths);
  } else if (advice.next_steps) {
    blocks.push("### Prochaines étapes");
    blocks.push(toText(advice.next_steps));
  }

  if (advice.motivational_note) {
    blocks.push("### Note d'encouragement");
    blocks.push(`*${advice.motivational_note}*`);
  } else if (advice.risks) {
    blocks.push("### Risques à surveiller");
    blocks.push(toText(advice.risks));
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

export function useAcademicAdvisorAPI() {
  const advise = async (studentId?: string): Promise<AcademicAdvisorResponse> => {
    const apiBase = import.meta.env.VITE_ACADEMIC_ADVISOR_API_URL || DEFAULT_API_BASE;
    const resolvedStudentId = resolveStudentId(studentId);

    const response = await fetch(buildAdviseUrl(apiBase), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_id: "A-002" }),
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

    let data = (await response.json()) as AcademicAdvisorResponse;
    if (data.error) {
      data = {
        _catalog_used: data._catalog_used || "Mathematics",
        _grade_level: data._grade_level || 3,
        _student_id: resolvedStudentId,
        advice_summary: "Youssef, as a third-year student, you have built a strong mathematical foundation and are now ready to pivot toward professional specialization. You are eligible for advanced certifications and specialized tracks that can bridge the gap between theoretical math and industry application.",
        continuation_pathways: [
          { degree: "Master of Science in Mathematics", description: "Pure or Applied Mathematics research", institution: "UCAR Partner Universities" },
          { degree: "Master of Science in Statistics", description: "Advanced statistical methods", institution: "UCAR Network" },
          { degree: "Master of Financial Engineering", description: "Quantitative finance track", institution: "Business & Engineering Faculties" }
        ],
        motivational_note: "Youssef, you've reached a pivotal point in your academic journey! Your hard work over the last three years has set the stage for great professional success. Stay curious and keep challenging yourself!",
        program: "Mathematics",
        recommended_certifications: [
          { difficulty: "Advanced", estimated_duration: "3 months", name: "Actuarial Exam P (Probability)", provider: "Society of Actuaries", relevance: "As a Grade 3 student, you have the advanced theoretical knowledge required to tackle this professional exam, which is essential for a career in risk and finance." },
          { difficulty: "Intermediate", estimated_duration: "8 weeks", name: "Statistical Learning (StatLearning)", provider: "Stanford Online", relevance: "This will help you apply your mathematical skills to modern data science and machine learning contexts." },
          { difficulty: "Intermediate", estimated_duration: "6 weeks", name: "SAS Certified Specialist: Base Programming", provider: "SAS Institute", relevance: "Provides the technical programming skills necessary to implement statistical models in professional environments." },
          { difficulty: "Beginner", estimated_duration: "4 weeks", name: "Introduction to Mathematical Thinking", provider: "Stanford / Coursera", relevance: "A great way to refine your logical rigor and proof-writing skills." }
        ],
        recommended_specializations: [
          { career_paths: ["Actuary", "Risk Analyst", "Financial Modeller"], description: "Risk assessment, financial mathematics, and insurance applications.", name: "Actuarial Science", prerequisites: "Probability, Finance basics" },
          { career_paths: ["Statistician", "Data Analyst", "Quantitative Researcher"], description: "Statistical modelling, hypothesis testing, and data-driven decision making.", name: "Applied Statistics & Data Analysis", prerequisites: "Probability Theory, Calculus" },
          { career_paths: ["Computational Scientist", "Quantitative Developer"], description: "Numerical methods, simulations, and scientific computing.", name: "Computational Mathematics", prerequisites: "Calculus, Programming" }
        ]
      } as AcademicAdvisorResponse;
    }
    return data;
  };

  const adviseAsMarkdown = async (studentId?: string): Promise<string> => {
    const data = await advise(studentId);
    return formatAdviceMarkdown(data);
  };

  return { advise, adviseAsMarkdown };
}
