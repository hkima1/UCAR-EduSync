export type StaffRole = "teacher" | "admin" | "researcher" | "director";
export type ContractType = "CDI" | "CDD" | "Vacataire";
export type LoadStatus = "overloaded" | "normal" | "underutilized";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  department: string;
  institutionId: string;
  contract: ContractType;
  hireDate: string;
  load: number; // hours per week
  loadStatus: LoadStatus;
  absenteeismRate: number; // %
  salary: number; // TND/month gross
  netSalary: number;
  paymentStatus: "Payé" | "En attente" | "En retard";
  paymentDate: string;
  trainingCompleted: number; // %
  specialization?: string;
};

export const staffMembers: StaffMember[] = [
  {
    id: "t1",
    name: "Dr. Slim Ben Younès",
    email: "s.benyounes@enit.utc.tn",
    role: "teacher",
    department: "Informatique",
    institutionId: "enit",
    contract: "CDI",
    hireDate: "2012-09-01",
    load: 16,
    loadStatus: "normal",
    absenteeismRate: 4,
    salary: 4800,
    netSalary: 3780,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 85,
    specialization: "Algorithmes & IA",
  },
  {
    id: "t2",
    name: "Dr. Amira Chaabane",
    email: "a.chaabane@enit.utc.tn",
    role: "teacher",
    department: "Informatique",
    institutionId: "enit",
    contract: "CDI",
    hireDate: "2015-09-01",
    load: 20,
    loadStatus: "overloaded",
    absenteeismRate: 2,
    salary: 4400,
    netSalary: 3470,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 60,
    specialization: "Bases de données",
  },
  {
    id: "t3",
    name: "Dr. Khaled Ferchichi",
    email: "k.ferchichi@insat.utc.tn",
    role: "teacher",
    department: "Réseaux & Télécoms",
    institutionId: "insat",
    contract: "CDI",
    hireDate: "2010-09-01",
    load: 17,
    loadStatus: "normal",
    absenteeismRate: 6,
    salary: 5100,
    netSalary: 4020,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 70,
    specialization: "Cybersécurité",
  },
  {
    id: "t4",
    name: "Pr. Sonia Khaldi",
    email: "s.khaldi@insat.utc.tn",
    role: "teacher",
    department: "Génie Logiciel",
    institutionId: "insat",
    contract: "CDI",
    hireDate: "2008-09-01",
    load: 15,
    loadStatus: "normal",
    absenteeismRate: 1,
    salary: 6200,
    netSalary: 4900,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 95,
    specialization: "DevOps & Cloud",
  },
  {
    id: "t5",
    name: "Dr. Leila Souissi",
    email: "l.souissi@ihec.utc.tn",
    role: "teacher",
    department: "Langues",
    institutionId: "ihec",
    contract: "CDI",
    hireDate: "2014-09-01",
    load: 22,
    loadStatus: "overloaded",
    absenteeismRate: 8,
    salary: 3900,
    netSalary: 3080,
    paymentStatus: "En attente",
    paymentDate: "2024-12-01",
    trainingCompleted: 50,
    specialization: "Anglais des affaires",
  },
  {
    id: "t6",
    name: "Dr. Mohamed Hamdi",
    email: "m.hamdi@fst.utc.tn",
    role: "teacher",
    department: "Mathématiques",
    institutionId: "fst",
    contract: "CDD",
    hireDate: "2021-09-01",
    load: 14,
    loadStatus: "normal",
    absenteeismRate: 3,
    salary: 3600,
    netSalary: 2840,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 40,
    specialization: "Analyse numérique",
  },
  {
    id: "t7",
    name: "Dr. Nadia Baccouche",
    email: "n.baccouche@isamm.utc.tn",
    role: "teacher",
    department: "Multimédia",
    institutionId: "isamm",
    contract: "CDI",
    hireDate: "2017-09-01",
    load: 18,
    loadStatus: "normal",
    absenteeismRate: 5,
    salary: 4100,
    netSalary: 3230,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 75,
    specialization: "UX Design & Web",
  },
  {
    id: "t8",
    name: "Prof. Riadh Khelil",
    email: "r.khelil@enit.utc.tn",
    role: "teacher",
    department: "Génie Électrique",
    institutionId: "enit",
    contract: "Vacataire",
    hireDate: "2023-02-01",
    load: 6,
    loadStatus: "underutilized",
    absenteeismRate: 12,
    salary: 1800,
    netSalary: 1440,
    paymentStatus: "En retard",
    paymentDate: "2024-12-05",
    trainingCompleted: 20,
    specialization: "Systèmes embarqués",
  },
  {
    id: "a1",
    name: "Mme. Hela Jaziri",
    email: "h.jaziri@insat.utc.tn",
    role: "admin",
    department: "Administration générale",
    institutionId: "insat",
    contract: "CDI",
    hireDate: "2011-03-15",
    load: 40,
    loadStatus: "normal",
    absenteeismRate: 2,
    salary: 5500,
    netSalary: 4340,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 88,
  },
  {
    id: "a2",
    name: "M. Tarek Mansour",
    email: "t.mansour@enit.utc.tn",
    role: "admin",
    department: "Finance & Comptabilité",
    institutionId: "enit",
    contract: "CDI",
    hireDate: "2013-06-01",
    load: 40,
    loadStatus: "normal",
    absenteeismRate: 3,
    salary: 4700,
    netSalary: 3710,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 65,
  },
  {
    id: "r1",
    name: "Pr. Ines Mrad",
    email: "i.mrad@enit.utc.tn",
    role: "researcher",
    department: "Recherche & Développement",
    institutionId: "enit",
    contract: "CDI",
    hireDate: "2009-09-01",
    load: 12,
    loadStatus: "underutilized",
    absenteeismRate: 1,
    salary: 7200,
    netSalary: 5680,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 100,
    specialization: "IA & Machine Learning",
  },
  {
    id: "r2",
    name: "Dr. Zied Gharbi",
    email: "z.gharbi@insat.utc.tn",
    role: "researcher",
    department: "Recherche & Développement",
    institutionId: "insat",
    contract: "CDD",
    hireDate: "2020-01-15",
    load: 10,
    loadStatus: "underutilized",
    absenteeismRate: 2,
    salary: 5800,
    netSalary: 4580,
    paymentStatus: "Payé",
    paymentDate: "2024-11-28",
    trainingCompleted: 90,
    specialization: "Cybersécurité avancée",
  },
];

export const currentTeacher = staffMembers[0]!;

export type LeaveRequest = {
  id: string;
  staffId: string;
  staffName: string;
  type: "Congé annuel" | "Maladie" | "Formation" | "Personnel";
  startDate: string;
  endDate: string;
  days: number;
  status: "En attente" | "Approuvé" | "Rejeté";
  note?: string;
};

export const leaveRequests: LeaveRequest[] = [
  {
    id: "lr1",
    staffId: "t5",
    staffName: "Dr. Leila Souissi",
    type: "Maladie",
    startDate: "2024-12-02",
    endDate: "2024-12-04",
    days: 3,
    status: "En attente",
  },
  {
    id: "lr2",
    staffId: "t2",
    staffName: "Dr. Amira Chaabane",
    type: "Formation",
    startDate: "2024-12-10",
    endDate: "2024-12-12",
    days: 3,
    status: "En attente",
    note: "Formation Docker & Kubernetes à Tunis",
  },
  {
    id: "lr3",
    staffId: "t3",
    staffName: "Dr. Khaled Ferchichi",
    type: "Congé annuel",
    startDate: "2024-12-23",
    endDate: "2024-12-31",
    days: 7,
    status: "Approuvé",
  },
  {
    id: "lr4",
    staffId: "a2",
    staffName: "M. Tarek Mansour",
    type: "Personnel",
    startDate: "2024-12-05",
    endDate: "2024-12-05",
    days: 1,
    status: "Approuvé",
  },
];

export type TrainingSession = {
  id: string;
  title: string;
  date: string;
  participants: number;
  completionRate: number;
  domain: string;
};

export const trainingSessions: TrainingSession[] = [
  { id: "tr1", title: "Pédagogie active & numérique", date: "2024-10-15", participants: 18, completionRate: 89, domain: "Pédagogie" },
  { id: "tr2", title: "Gestion de projets Agile", date: "2024-11-05", participants: 12, completionRate: 75, domain: "Management" },
  { id: "tr3", title: "Sécurité informatique — ISO 27001", date: "2024-11-20", participants: 8, completionRate: 62, domain: "Sécurité" },
  { id: "tr4", title: "Bien-être au travail", date: "2024-12-03", participants: 22, completionRate: 0, domain: "RH" },
];

export type RecruitmentPosition = {
  id: string;
  department: string;
  title: string;
  slots: number;
  deadline: string;
  status: "Ouvert" | "Fermé" | "Pourvu";
  applicants: { name: string; status: "Screening" | "Entretien" | "Recruté" | "Rejeté" }[];
};

export const recruitmentPositions: RecruitmentPosition[] = [
  {
    id: "rp1",
    department: "Informatique",
    title: "Enseignant — IA & Data Science",
    slots: 2,
    deadline: "2025-01-15",
    status: "Ouvert",
    applicants: [
      { name: "Dr. Ayoub Chtourou", status: "Entretien" },
      { name: "Mme. Sarra Triki", status: "Screening" },
      { name: "M. Firas Belaid", status: "Rejeté" },
    ],
  },
  {
    id: "rp2",
    department: "Finance",
    title: "Responsable budgétaire",
    slots: 1,
    deadline: "2024-12-31",
    status: "Ouvert",
    applicants: [
      { name: "M. Hatem Sfar", status: "Entretien" },
      { name: "Mme. Olfa Dridi", status: "Recruté" },
    ],
  },
];
