export type ResearchProject = {
  id: string;
  title: string;
  domain: string;
  institutionId: string;
  teamSize: number;
  funding: number; // TND
  fundingBody: string;
  startDate: string;
  endDate: string;
  progress: number; // %
  status: "active" | "completed" | "suspended" | "pending";
  milestones: { name: string; due: string; status: "done" | "in-progress" | "pending" }[];
};

export const researchProjects: ResearchProject[] = [
  {
    id: "rp1",
    title: "IA pour le diagnostic médical précoce",
    domain: "Intelligence Artificielle",
    institutionId: "insat",
    teamSize: 6,
    funding: 380000,
    fundingBody: "Ministère de l'Enseignement Supérieur",
    startDate: "2023-10-01",
    endDate: "2025-09-30",
    progress: 62,
    status: "active",
    milestones: [
      { name: "Collecte et annotation du dataset", due: "2024-03-31", status: "done" },
      { name: "Prototype modèle CNN", due: "2024-06-30", status: "done" },
      { name: "Validation clinique Phase 1", due: "2024-12-31", status: "in-progress" },
      { name: "Publication résultats", due: "2025-06-30", status: "pending" },
      { name: "Déploiement pilote", due: "2025-09-30", status: "pending" },
    ],
  },
  {
    id: "rp2",
    title: "Cybersécurité des infrastructures critiques tunisiennes",
    domain: "Cybersécurité",
    institutionId: "insat",
    teamSize: 4,
    funding: 245000,
    fundingBody: "ANSI Tunisie",
    startDate: "2024-01-15",
    endDate: "2025-12-31",
    progress: 38,
    status: "active",
    milestones: [
      { name: "Cartographie des infrastructures", due: "2024-04-30", status: "done" },
      { name: "Analyse de vulnérabilités", due: "2024-09-30", status: "done" },
      { name: "Framework de mitigation", due: "2025-03-31", status: "in-progress" },
      { name: "Rapport final", due: "2025-12-31", status: "pending" },
    ],
  },
  {
    id: "rp3",
    title: "Optimisation énergétique des bâtiments universitaires",
    domain: "Génie Énergétique",
    institutionId: "enit",
    teamSize: 5,
    funding: 310000,
    fundingBody: "ANME Tunisie",
    startDate: "2023-03-01",
    endDate: "2025-02-28",
    progress: 85,
    status: "active",
    milestones: [
      { name: "Audit énergétique ENIT", due: "2023-08-31", status: "done" },
      { name: "Installation capteurs IoT", due: "2024-01-31", status: "done" },
      { name: "Modèle de prédiction consommation", due: "2024-06-30", status: "done" },
      { name: "Prototype système de contrôle", due: "2024-11-30", status: "in-progress" },
      { name: "Évaluation impact & publication", due: "2025-02-28", status: "pending" },
    ],
  },
  {
    id: "rp4",
    title: "Blockchain pour la certification académique",
    domain: "Technologies Distribuées",
    institutionId: "enit",
    teamSize: 3,
    funding: 180000,
    fundingBody: "Union Européenne — Erasmus+",
    startDate: "2024-06-01",
    endDate: "2026-05-31",
    progress: 15,
    status: "active",
    milestones: [
      { name: "État de l'art & conception", due: "2024-09-30", status: "done" },
      { name: "Smart contracts développement", due: "2025-03-31", status: "in-progress" },
      { name: "Pilote avec 3 universités", due: "2025-12-31", status: "pending" },
    ],
  },
  {
    id: "rp5",
    title: "Analyse des comportements d'apprentissage en ligne",
    domain: "Sciences de l'Éducation",
    institutionId: "isamm",
    teamSize: 4,
    funding: 120000,
    fundingBody: "UNESCO Maghreb",
    startDate: "2023-09-01",
    endDate: "2024-08-31",
    progress: 100,
    status: "completed",
    milestones: [
      { name: "Collecte données Moodle", due: "2023-12-31", status: "done" },
      { name: "Analyse comportementale", due: "2024-03-31", status: "done" },
      { name: "Recommandations pédagogiques", due: "2024-06-30", status: "done" },
      { name: "Rapport final UNESCO", due: "2024-08-31", status: "done" },
    ],
  },
];

export type Publication = {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  date: string;
  type: "article" | "conférence" | "livre";
  impactFactor?: number;
  institutionId: string;
};

export const publications: Publication[] = [
  {
    id: "pub1",
    title: "Deep Learning approaches for early disease detection in Tunisian healthcare",
    authors: ["Pr. Ines Mrad", "Dr. Zied Gharbi"],
    journal: "IEEE Transactions on Medical Imaging",
    date: "2024-08-15",
    type: "article",
    impactFactor: 8.9,
    institutionId: "insat",
  },
  {
    id: "pub2",
    title: "SDN-based intrusion detection for campus networks",
    authors: ["Dr. Khaled Ferchichi", "Dr. Zied Gharbi"],
    journal: "IEEE CNRS — SIGCOMM 2024",
    date: "2024-09-22",
    type: "conférence",
    institutionId: "insat",
  },
  {
    id: "pub3",
    title: "Optimisation énergétique par IoT : cas université ENIT",
    authors: ["Pr. Riadh Khelil"],
    journal: "Revue Tunisienne d'Ingénierie",
    date: "2024-07-01",
    type: "article",
    impactFactor: 1.4,
    institutionId: "enit",
  },
  {
    id: "pub4",
    title: "Pédagogie hybride et engagement étudiant post-COVID en Tunisie",
    authors: ["Dr. Nadia Baccouche", "Mme. Hela Jaziri"],
    journal: "Revue internationale d'éducation",
    date: "2024-10-10",
    type: "article",
    impactFactor: 2.1,
    institutionId: "isamm",
  },
];

export type Grant = {
  id: string;
  name: string;
  fundingBody: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "pending" | "active" | "closed";
  consumed: number;
  institutionId: string;
};

export const grants: Grant[] = [
  {
    id: "g1",
    name: "Programme National Recherche & Innovation — MESRST",
    fundingBody: "Ministère ESR",
    amount: 620000,
    startDate: "2023-01-01",
    endDate: "2025-12-31",
    status: "active",
    consumed: 310000,
    institutionId: "insat",
  },
  {
    id: "g2",
    name: "Erasmus+ Mobilité & Innovation Pédagogique",
    fundingBody: "Union Européenne",
    amount: 280000,
    startDate: "2024-06-01",
    endDate: "2026-05-31",
    status: "active",
    consumed: 42000,
    institutionId: "enit",
  },
  {
    id: "g3",
    name: "Coopération franco-tunisienne en IA",
    fundingBody: "Campus France / IRD",
    amount: 195000,
    startDate: "2022-09-01",
    endDate: "2024-08-31",
    status: "closed",
    consumed: 195000,
    institutionId: "insat",
  },
];
