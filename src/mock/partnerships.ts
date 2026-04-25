export type PartnerType = "Université" | "Entreprise" | "ONG" | "Gouvernement";
export type AgreementStatus = "active" | "expired" | "pending";

export type Partnership = {
  id: string;
  partnerName: string;
  type: PartnerType;
  country: string;
  institutionId: string;
  startDate: string;
  endDate: string;
  status: AgreementStatus;
  description: string;
  contactName: string;
  contactEmail: string;
};

export const partnerships: Partnership[] = [
  {
    id: "pa1",
    partnerName: "Université Paris-Saclay",
    type: "Université",
    country: "France",
    institutionId: "enit",
    startDate: "2022-09-01",
    endDate: "2025-08-31",
    status: "active",
    description: "Cotutelle de thèse, échanges de chercheurs et co-publications en IA et systèmes embarqués.",
    contactName: "Prof. Emmanuel Dupont",
    contactEmail: "e.dupont@universite-paris-saclay.fr",
  },
  {
    id: "pa2",
    partnerName: "Tunisie Telecom",
    type: "Entreprise",
    country: "Tunisie",
    institutionId: "insat",
    startDate: "2023-01-15",
    endDate: "2025-01-14",
    status: "active",
    description: "Convention de stages, projets de fin d'études, financement de 3 bourses de recherche en télécoms.",
    contactName: "Mme. Rym Zouari",
    contactEmail: "r.zouari@tunisietelecom.tn",
  },
  {
    id: "pa3",
    partnerName: "IBM Tunisie",
    type: "Entreprise",
    country: "Tunisie",
    institutionId: "insat",
    startDate: "2021-06-01",
    endDate: "2024-05-31",
    status: "expired",
    description: "Programme IBM Academic Initiative : accès aux outils cloud, certifications étudiants.",
    contactName: "M. Amine Trabelsi",
    contactEmail: "a.trabelsi@ibm.com",
  },
  {
    id: "pa4",
    partnerName: "Banque de l'Habitat",
    type: "Entreprise",
    country: "Tunisie",
    institutionId: "ihec",
    startDate: "2023-09-01",
    endDate: "2025-08-31",
    status: "active",
    description: "Stages en analyse financière, masterclasses métier et financement de 2 chaires d'enseignement.",
    contactName: "M. Kamel Jouini",
    contactEmail: "k.jouini@bh.com.tn",
  },
  {
    id: "pa5",
    partnerName: "Université de Montréal",
    type: "Université",
    country: "Canada",
    institutionId: "ihec",
    startDate: "2022-01-01",
    endDate: "2025-12-31",
    status: "active",
    description: "Programme d'échange étudiants (double diplôme MBA), mobilité enseignants.",
    contactName: "Prof. Pierre Laval",
    contactEmail: "p.laval@umontreal.ca",
  },
  {
    id: "pa6",
    partnerName: "USAID Tunisie",
    type: "Gouvernement",
    country: "USA",
    institutionId: "enit",
    startDate: "2023-03-01",
    endDate: "2026-02-28",
    status: "active",
    description: "Projet EQUIPT : renforcement des capacités en génie des systèmes et entrepreneuriat technologique.",
    contactName: "M. David Morris",
    contactEmail: "d.morris@usaid.gov",
  },
  {
    id: "pa7",
    partnerName: "GIZ Tunisie",
    type: "ONG",
    country: "Allemagne",
    institutionId: "isamm",
    startDate: "2024-01-01",
    endDate: "2025-06-30",
    status: "active",
    description: "Programme emploi jeunes : ateliers compétences numériques, mentoring avec entreprises allemandes.",
    contactName: "Mme. Anna Schneider",
    contactEmail: "a.schneider@giz.de",
  },
  {
    id: "pa8",
    partnerName: "Microsoft Imagine",
    type: "Entreprise",
    country: "USA",
    institutionId: "fst",
    startDate: "2024-06-01",
    endDate: "2024-11-30",
    status: "expired",
    description: "Accès aux outils Microsoft Azure & M365 pour étudiants. Programme expiré — renouvellement en cours.",
    contactName: "Support académique Microsoft",
    contactEmail: "academic@microsoft.com",
  },
  {
    id: "pa9",
    partnerName: "Banque Centrale de Tunisie",
    type: "Gouvernement",
    country: "Tunisie",
    institutionId: "ihec",
    startDate: "2024-10-01",
    endDate: "2027-09-30",
    status: "active",
    description: "Convention de recherche en finance islamique et inclusion financière.",
    contactName: "Dr. Hichem Karray",
    contactEmail: "h.karray@bct.gov.tn",
  },
  {
    id: "pa10",
    partnerName: "Huawei Technologies Tunisie",
    type: "Entreprise",
    country: "Chine",
    institutionId: "insat",
    startDate: "2024-09-15",
    endDate: "2027-09-14",
    status: "pending",
    description: "Accord en cours de validation : lab 5G, certifications Huawei, financement équipements.",
    contactName: "M. Wei Zhang",
    contactEmail: "w.zhang@huawei.com",
  },
];

export type PartnerEvent = {
  id: string;
  title: string;
  type: "Conférence" | "Atelier" | "Visite" | "Cours conjoint";
  date: string;
  location: string;
  partnerName: string;
  institutionId: string;
  status: "upcoming" | "ongoing" | "completed";
  invitedRoles: string[];
  agenda: string;
};

export const partnerEvents: PartnerEvent[] = [
  {
    id: "pe1",
    title: "Journée IA & Innovation — INSAT × Tunisie Telecom",
    type: "Conférence",
    date: "2024-12-10",
    location: "Amphithéâtre principal — INSAT",
    partnerName: "Tunisie Telecom",
    institutionId: "insat",
    status: "upcoming",
    invitedRoles: ["Étudiants", "Enseignants", "Directeur"],
    agenda: "Keynotes sur l'IA dans les télécoms, tables rondes carrières, démonstrations prototypes.",
  },
  {
    id: "pe2",
    title: "Workshop Design Thinking — ENIT × USAID",
    type: "Atelier",
    date: "2024-11-25",
    location: "Salle projets — ENIT",
    partnerName: "USAID Tunisie",
    institutionId: "enit",
    status: "completed",
    invitedRoles: ["Étudiants", "Enseignants"],
    agenda: "Introduction au Design Thinking, exercices pratiques en équipes, pitch final.",
  },
  {
    id: "pe3",
    title: "Cours conjoint Finance Islamique — IHEC × BCT",
    type: "Cours conjoint",
    date: "2024-12-05",
    location: "Salle A12 — IHEC",
    partnerName: "Banque Centrale de Tunisie",
    institutionId: "ihec",
    status: "upcoming",
    invitedRoles: ["Étudiants Master Finance", "Enseignants"],
    agenda: "Présentation des instruments de finance islamique, étude de cas Sukuk en Tunisie.",
  },
];

export type MobilityRecord = {
  id: string;
  studentName: string;
  studentId: string;
  originInstitution: string;
  destinationInstitution: string;
  program: string;
  semester: string;
  status: "active" | "completed" | "cancelled";
  type: "outgoing" | "incoming";
};

export const mobilityRecords: MobilityRecord[] = [
  {
    id: "mr1",
    studentName: "Salma Khelifi",
    studentId: "s3",
    originInstitution: "ISAMM",
    destinationInstitution: "Université Paris 8",
    program: "Erasmus+ Mobilité Études",
    semester: "S4 2024",
    status: "completed",
    type: "outgoing",
  },
  {
    id: "mr2",
    studentName: "Nour Ben Amor",
    studentId: "s5",
    originInstitution: "IHEC Carthage",
    destinationInstitution: "Université de Montréal",
    program: "Double Diplôme MBA",
    semester: "S5 2024",
    status: "active",
    type: "outgoing",
  },
  {
    id: "mr3",
    studentName: "Alice Martin",
    studentId: "ext1",
    originInstitution: "Université Lyon 2",
    destinationInstitution: "IHEC Carthage",
    program: "Échange ERASMUS",
    semester: "S5 2024",
    status: "active",
    type: "incoming",
  },
];
