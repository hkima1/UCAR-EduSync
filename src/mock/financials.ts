export type DepartmentBudget = {
  department: string;
  allocated: number; // TND
  consumed: number;
  remaining: number;
  executionRate: number; // %
};

export type AnomalyTransaction = {
  id: string;
  date: string;
  amount: number;
  department: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  aiExplanation: string;
  status: "open" | "investigated" | "dismissed";
};

export type MonthlySpend = {
  month: string;
  amount: number;
};

export const institutionBudgets: Record<string, DepartmentBudget[]> = {
  insat: [
    { department: "Informatique", allocated: 280000, consumed: 241600, remaining: 38400, executionRate: 86 },
    { department: "Réseaux & Télécoms", allocated: 210000, consumed: 168000, remaining: 42000, executionRate: 80 },
    { department: "Génie Logiciel", allocated: 195000, consumed: 179400, remaining: 15600, executionRate: 92 },
    { department: "Administration", allocated: 320000, consumed: 243200, remaining: 76800, executionRate: 76 },
    { department: "Recherche & Dev", allocated: 450000, consumed: 337500, remaining: 112500, executionRate: 75 },
    { department: "Infrastructures", allocated: 180000, consumed: 162000, remaining: 18000, executionRate: 90 },
  ],
  enit: [
    { department: "Génie Informatique", allocated: 260000, consumed: 208000, remaining: 52000, executionRate: 80 },
    { department: "Génie Électrique", allocated: 230000, consumed: 207000, remaining: 23000, executionRate: 90 },
    { department: "Génie Civil", allocated: 310000, consumed: 263500, remaining: 46500, executionRate: 85 },
    { department: "Administration", allocated: 290000, consumed: 217500, remaining: 72500, executionRate: 75 },
    { department: "Recherche", allocated: 420000, consumed: 302400, remaining: 117600, executionRate: 72 },
  ],
  ihec: [
    { department: "Finance & Comptabilité", allocated: 175000, consumed: 140000, remaining: 35000, executionRate: 80 },
    { department: "Management", allocated: 160000, consumed: 148480, remaining: 11520, executionRate: 93 },
    { department: "Marketing", allocated: 145000, consumed: 101500, remaining: 43500, executionRate: 70 },
    { department: "Administration", allocated: 200000, consumed: 166000, remaining: 34000, executionRate: 83 },
  ],
};

export const anomalyTransactions: AnomalyTransaction[] = [
  {
    id: "anx1",
    date: "2024-11-08",
    amount: 48000,
    department: "Infrastructures",
    type: "Achat équipement",
    severity: "high",
    aiExplanation:
      "Montant 3,2× supérieur à la moyenne historique pour ce type d'achat. Fournisseur non référencé dans la base contractuelle.",
    status: "open",
  },
  {
    id: "anx2",
    date: "2024-11-15",
    amount: 12400,
    department: "Administration",
    type: "Frais de déplacement",
    severity: "medium",
    aiExplanation:
      "Volume de déplacements inhabituellement élevé pour novembre. Trois missions enregistrées la même semaine pour le même agent.",
    status: "open",
  },
  {
    id: "anx3",
    date: "2024-10-22",
    amount: 6800,
    department: "Recherche & Dev",
    type: "Abonnement logiciel",
    severity: "low",
    aiExplanation: "Double facturation détectée : même référence de licence facturée deux fois à 7 jours d'intervalle.",
    status: "dismissed",
  },
  {
    id: "anx4",
    date: "2024-11-20",
    amount: 92000,
    department: "Génie Logiciel",
    type: "Prestation externe",
    severity: "critical",
    aiExplanation:
      "Dépassement budgétaire de 38 % sur ce poste. La prestation ne correspond à aucun bon de commande validé dans le système.",
    status: "open",
  },
  {
    id: "anx5",
    date: "2024-11-01",
    amount: 3200,
    department: "Informatique",
    type: "Fournitures bureau",
    severity: "low",
    aiExplanation: "Montant cohérent mais fréquence d'achat anormalement élevée (4e commande ce trimestre pour le même article).",
    status: "investigated",
  },
];

export const monthlySpend: MonthlySpend[] = [
  { month: "Jan", amount: 142000 },
  { month: "Fév", amount: 158000 },
  { month: "Mar", amount: 171000 },
  { month: "Avr", amount: 155000 },
  { month: "Mai", amount: 167000 },
  { month: "Juin", amount: 182000 },
  { month: "Sep", amount: 198000 },
  { month: "Oct", amount: 210000 },
  { month: "Nov", amount: 224000 },
  { month: "Déc", amount: 105000 },
];

export type SpendRequest = {
  id: string;
  submittedBy: string;
  department: string;
  amount: number;
  reason: string;
  urgency: "normal" | "urgent";
  date: string;
  status: "pending" | "approved" | "rejected";
};

export const spendRequests: SpendRequest[] = [
  {
    id: "sr1",
    submittedBy: "Dr. Amira Chaabane",
    department: "Informatique",
    amount: 8500,
    reason: "Achat de 5 licences Oracle Database pour les TP du S5",
    urgency: "normal",
    date: "2024-11-22",
    status: "pending",
  },
  {
    id: "sr2",
    submittedBy: "M. Tarek Mansour",
    department: "Administration",
    amount: 2200,
    reason: "Renouvellement abonnement outils RH (SAGE Paie)",
    urgency: "urgent",
    date: "2024-11-24",
    status: "pending",
  },
  {
    id: "sr3",
    submittedBy: "Pr. Sonia Khaldi",
    department: "Génie Logiciel",
    amount: 4800,
    reason: "Inscription 3 enseignants à la formation Docker/K8s",
    urgency: "normal",
    date: "2024-11-18",
    status: "approved",
  },
];

export const esgData = {
  current: {
    energyKwh: 48200,
    carbonTco2: 18.4,
    recyclingRate: 34,
    sustainableMobility: 42,
    accessibilityScore: 67,
  },
  trend: [
    { month: "Jan", energy: 51000, carbon: 19.8 },
    { month: "Fév", energy: 49800, carbon: 19.2 },
    { month: "Mar", energy: 47600, carbon: 18.5 },
    { month: "Avr", energy: 46200, carbon: 17.9 },
    { month: "Mai", energy: 44800, carbon: 17.4 },
    { month: "Juin", energy: 43100, carbon: 16.8 },
    { month: "Sep", energy: 49500, carbon: 19.1 },
    { month: "Oct", energy: 48900, carbon: 18.7 },
    { month: "Nov", energy: 48200, carbon: 18.4 },
  ],
  goals: [
    { metric: "Énergie (kWh/mois)", current: 48200, target: 40000, deadline: "2025-12-31", unit: "kWh" },
    { metric: "Carbon (tCO₂/an)", current: 18.4, target: 14.0, deadline: "2025-12-31", unit: "tCO₂" },
    { metric: "Recyclage", current: 34, target: 55, deadline: "2025-06-30", unit: "%" },
    { metric: "Mobilité durable", current: 42, target: 60, deadline: "2025-12-31", unit: "%" },
    { metric: "Accessibilité campus", current: 67, target: 85, deadline: "2026-06-30", unit: "/100" },
  ],
};

export const esgMetrics: Record<string, { carbonFootprint: number; energyConsumption: number; wasteRecycledPercentage: number; waterUsage: number }> = {
  insat: {
    carbonFootprint: 18.4,
    energyConsumption: 48200,
    wasteRecycledPercentage: 34,
    waterUsage: 1200,
  },
  enit: {
    carbonFootprint: 22.1,
    energyConsumption: 51000,
    wasteRecycledPercentage: 40,
    waterUsage: 1500,
  },
};

// University-wide financial summary for super admin
export const universityFinancials = [
  { institutionId: "enit", name: "ENIT", allocated: 2800000, consumed: 2156000, executionRate: 77, status: "on track" },
  { institutionId: "insat", name: "INSAT", allocated: 3200000, consumed: 3008000, executionRate: 94, status: "at risk" },
  { institutionId: "ihec", name: "IHEC Carthage", allocated: 1850000, consumed: 1443000, executionRate: 78, status: "on track" },
  { institutionId: "isamm", name: "ISAMM", allocated: 1400000, consumed: 1218000, executionRate: 87, status: "on track" },
  { institutionId: "fst", name: "FST Tunis", allocated: 2100000, consumed: 2142000, executionRate: 102, status: "critical" },
  { institutionId: "iset-nabeul", name: "ISET Nabeul", allocated: 980000, consumed: 784000, executionRate: 80, status: "on track" },
  { institutionId: "isit", name: "ISIT", allocated: 1150000, consumed: 1069500, executionRate: 93, status: "at risk" },
  { institutionId: "esst", name: "ESST", allocated: 1320000, consumed: 990000, executionRate: 75, status: "on track" },
];
