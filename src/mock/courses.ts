export type CourseStatus = "planned" | "completed" | "cancelled";
export type ExamType = "contrôle" | "examen final" | "rattrapage";

export type CourseSession = {
  id: string;
  date: string;
  topic: string;
  type: "Cours" | "TD" | "TP";
  status: CourseStatus;
  notes?: string;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  institutionId: string;
  department: string;
  semester: number;
  credits: number;
  studentCount: number;
  avgGrade: number;
  attendanceRate: number;
  sessions: CourseSession[];
  syllabus: string;
};

export const courses: Course[] = [
  {
    id: "c1",
    name: "Algorithmique avancée",
    code: "INF301",
    teacherId: "t1",
    teacherName: "Dr. Slim Ben Younès",
    institutionId: "enit",
    department: "Informatique",
    semester: 5,
    credits: 6,
    studentCount: 42,
    avgGrade: 13.8,
    attendanceRate: 86,
    syllabus:
      "Ce cours couvre les algorithmes de tri avancés, les structures de données complexes (arbres B, tas de Fibonacci), la programmation dynamique, les algorithmes gloutons, la complexité algorithmique et les problèmes NP-complets.",
    sessions: [
      { id: "cs1", date: "2024-10-07", topic: "Introduction & rappels", type: "Cours", status: "completed" },
      { id: "cs2", date: "2024-10-14", topic: "Tri par fusion & rapide", type: "Cours", status: "completed" },
      { id: "cs3", date: "2024-10-21", topic: "Arbres binaires de recherche", type: "TD", status: "completed" },
      { id: "cs4", date: "2024-10-28", topic: "Heaps & Priority Queues", type: "Cours", status: "completed" },
      { id: "cs5", date: "2024-11-04", topic: "Programmation dynamique I", type: "Cours", status: "completed" },
      { id: "cs6", date: "2024-11-11", topic: "TP — Implémentation en C", type: "TP", status: "completed", notes: "17/42 présents" },
      { id: "cs7", date: "2024-11-18", topic: "Programmation dynamique II", type: "Cours", status: "completed" },
      { id: "cs8", date: "2024-11-25", topic: "Algorithmes gloutons", type: "TD", status: "completed" },
      { id: "cs9", date: "2024-12-02", topic: "Complexité NP", type: "Cours", status: "planned" },
      { id: "cs10", date: "2024-12-09", topic: "Révision & cas pratiques", type: "TD", status: "planned" },
      { id: "cs11", date: "2024-12-16", topic: "Contrôle final", type: "Cours", status: "planned" },
    ],
  },
  {
    id: "c2",
    name: "Bases de données",
    code: "INF302",
    teacherId: "t2",
    teacherName: "Dr. Amira Chaabane",
    institutionId: "enit",
    department: "Informatique",
    semester: 5,
    credits: 5,
    studentCount: 38,
    avgGrade: 12.4,
    attendanceRate: 78,
    syllabus:
      "Modélisation entité-association, SQL avancé, normalisation (1NF–BCNF), procédures stockées, triggers, index et optimisation de requêtes, introduction aux bases NoSQL (MongoDB, Redis).",
    sessions: [
      { id: "cs12", date: "2024-10-08", topic: "Modèle relationnel", type: "Cours", status: "completed" },
      { id: "cs13", date: "2024-10-15", topic: "SQL — SELECT avancé", type: "TD", status: "completed" },
      { id: "cs14", date: "2024-10-22", topic: "Normalisation", type: "Cours", status: "completed" },
      { id: "cs15", date: "2024-10-29", topic: "TP — PostgreSQL", type: "TP", status: "completed" },
      { id: "cs16", date: "2024-11-05", topic: "Transactions & ACID", type: "Cours", status: "completed" },
      { id: "cs17", date: "2024-11-12", topic: "Indexation & performances", type: "Cours", status: "completed" },
      { id: "cs18", date: "2024-11-19", topic: "NoSQL Introduction", type: "Cours", status: "planned" },
      { id: "cs19", date: "2024-11-26", topic: "TP — MongoDB", type: "TP", status: "planned" },
    ],
  },
  {
    id: "c3",
    name: "Réseaux & Protocoles",
    code: "INF303",
    teacherId: "t3",
    teacherName: "Dr. Khaled Ferchichi",
    institutionId: "insat",
    department: "Réseaux & Télécoms",
    semester: 5,
    credits: 4,
    studentCount: 55,
    avgGrade: 11.9,
    attendanceRate: 72,
    syllabus:
      "Modèle OSI, TCP/IP en profondeur, routage statique et dynamique (OSPF, BGP), VLAN, sécurité réseau, pare-feux, VPN, introduction aux réseaux SDN.",
    sessions: [
      { id: "cs20", date: "2024-10-09", topic: "Modèle OSI — Révision", type: "Cours", status: "completed" },
      { id: "cs21", date: "2024-10-16", topic: "TCP/IP Deep Dive", type: "Cours", status: "completed" },
      { id: "cs22", date: "2024-10-23", topic: "TP — Wireshark", type: "TP", status: "completed" },
      { id: "cs23", date: "2024-10-30", topic: "Routage — OSPF", type: "TD", status: "completed" },
      { id: "cs24", date: "2024-11-06", topic: "VLAN & Switching", type: "Cours", status: "completed" },
      { id: "cs25", date: "2024-11-13", topic: "VPN & IPSec", type: "Cours", status: "planned" },
    ],
  },
  {
    id: "c4",
    name: "Génie logiciel",
    code: "INF304",
    teacherId: "t4",
    teacherName: "Pr. Sonia Khaldi",
    institutionId: "insat",
    department: "Génie Logiciel",
    semester: 5,
    credits: 5,
    studentCount: 48,
    avgGrade: 14.6,
    attendanceRate: 91,
    syllabus:
      "Méthodologies agiles (Scrum, Kanban), modélisation UML, patrons de conception (GoF), refactoring, tests unitaires & TDD, intégration continue, DevOps et déploiement cloud.",
    sessions: [
      { id: "cs26", date: "2024-10-07", topic: "Introduction Agile", type: "Cours", status: "completed" },
      { id: "cs27", date: "2024-10-14", topic: "UML — Cas d'usage", type: "TD", status: "completed" },
      { id: "cs28", date: "2024-10-21", topic: "Design Patterns I", type: "Cours", status: "completed" },
      { id: "cs29", date: "2024-10-28", topic: "TDD — JUnit", type: "TP", status: "completed" },
      { id: "cs30", date: "2024-11-04", topic: "CI/CD Pipeline", type: "Cours", status: "completed" },
      { id: "cs31", date: "2024-11-11", topic: "Docker & Kubernetes", type: "TP", status: "completed" },
      { id: "cs32", date: "2024-11-18", topic: "Architecture microservices", type: "Cours", status: "planned" },
    ],
  },
  {
    id: "c5",
    name: "Analyse financière",
    code: "FIN401",
    teacherId: "t5",
    teacherName: "Dr. Leila Souissi",
    institutionId: "ihec",
    department: "Finance",
    semester: 5,
    credits: 4,
    studentCount: 62,
    avgGrade: 13.1,
    attendanceRate: 83,
    syllabus:
      "Analyse des états financiers, ratios de liquidité et rentabilité, évaluation d'entreprise (DCF, multiples), analyse du risque financier, introduction aux marchés des capitaux tunisiens.",
    sessions: [
      { id: "cs33", date: "2024-10-08", topic: "Bilan & compte de résultat", type: "Cours", status: "completed" },
      { id: "cs34", date: "2024-10-15", topic: "Ratios financiers", type: "TD", status: "completed" },
      { id: "cs35", date: "2024-10-22", topic: "Flux de trésorerie", type: "Cours", status: "completed" },
      { id: "cs36", date: "2024-10-29", topic: "Évaluation DCF", type: "TD", status: "completed" },
      { id: "cs37", date: "2024-11-05", topic: "Marché financier tunisien", type: "Cours", status: "planned" },
    ],
  },
];

export type Exam = {
  id: string;
  courseId: string;
  courseName: string;
  type: ExamType;
  date: string;
  time: string;
  duration: number; // minutes
  room: string;
  proctors: string[];
  instructions?: string;
  studentCount: number;
};

export const exams: Exam[] = [
  {
    id: "e1",
    courseId: "c1",
    courseName: "Algorithmique avancée",
    type: "examen final",
    date: "2024-12-12",
    time: "08:30",
    duration: 120,
    room: "Amphi A — ENIT",
    proctors: ["Dr. Slim Ben Younès", "M. Mohamed Hamdi"],
    instructions: "Documents non autorisés. Calculatrice interdite.",
    studentCount: 42,
  },
  {
    id: "e2",
    courseId: "c2",
    courseName: "Bases de données",
    type: "examen final",
    date: "2024-12-15",
    time: "10:00",
    duration: 120,
    room: "Amphi B — ENIT",
    proctors: ["Dr. Amira Chaabane"],
    instructions: "Exercices pratiques SQL autorisés sur papier uniquement.",
    studentCount: 38,
  },
  {
    id: "e3",
    courseId: "c3",
    courseName: "Réseaux & Protocoles",
    type: "contrôle",
    date: "2024-11-28",
    time: "14:00",
    duration: 90,
    room: "Salle B204",
    proctors: ["Dr. Khaled Ferchichi"],
    studentCount: 55,
  },
  {
    id: "e4",
    courseId: "c4",
    courseName: "Génie logiciel",
    type: "examen final",
    date: "2024-12-18",
    time: "09:00",
    duration: 120,
    room: "Amphi C — INSAT",
    proctors: ["Pr. Sonia Khaldi", "Dr. Slim Ben Younès"],
    instructions: "Cours et TD autorisés. Accès internet interdit.",
    studentCount: 48,
  },
];

export type GradeRecord = {
  studentId: string;
  studentName: string;
  courseId: string;
  examId: string;
  grade: number;
  max: number;
  status: "Validé" | "Échec";
  published: boolean;
  notes?: string;
};

export const gradeRecords: GradeRecord[] = [
  { studentId: "s1", studentName: "Yasmine Ben Salah", courseId: "c1", examId: "e1", grade: 15.5, max: 20, status: "Validé", published: true },
  { studentId: "s2", studentName: "Mohamed Trabelsi", courseId: "c1", examId: "e1", grade: 13.0, max: 20, status: "Validé", published: true },
  { studentId: "s4", studentName: "Karim Bouazizi", courseId: "c1", examId: "e1", grade: 9.5, max: 20, status: "Échec", published: true },
  { studentId: "s6", studentName: "Aymen Gharbi", courseId: "c1", examId: "e1", grade: 12.0, max: 20, status: "Validé", published: true },
  { studentId: "s7", studentName: "Rim Mejri", courseId: "c1", examId: "e1", grade: 16.5, max: 20, status: "Validé", published: true },
  { studentId: "s8", studentName: "Wassim Hammami", courseId: "c1", examId: "e1", grade: 14.0, max: 20, status: "Validé", published: true },
  { studentId: "s3", studentName: "Salma Khelifi", courseId: "c2", examId: "e2", grade: 17.0, max: 20, status: "Validé", published: false },
  { studentId: "s5", studentName: "Nour Ben Amor", courseId: "c2", examId: "e2", grade: 11.0, max: 20, status: "Validé", published: false },
];

export const teacherFeedbackData = {
  courses: [
    {
      id: "c1",
      name: "Algorithmique avancée",
      semester: "S5 2024",
      ratings: { clarity: 4.1, content: 4.3, availability: 3.8, fairness: 4.0, overall: 4.2 },
      comments: [
        { date: "2024-11-14", rating: 5, text: "Cours très bien structuré, les TP complètent parfaitement la théorie." },
        { date: "2024-11-14", rating: 4, text: "Bon contenu mais rythme un peu rapide sur la programmation dynamique." },
        { date: "2024-11-15", rating: 3, text: "Disponibilité limitée en dehors des heures de cours." },
        { date: "2024-11-16", rating: 4, text: "Excellente pédagogie, exercices bien choisis." },
      ],
    },
    {
      id: "c2",
      name: "Bases de données",
      semester: "S5 2024",
      ratings: { clarity: 3.7, content: 4.0, availability: 3.5, fairness: 3.9, overall: 3.8 },
      comments: [
        { date: "2024-11-12", rating: 3, text: "Les TP sur PostgreSQL étaient bien mais manque de supports de cours." },
        { date: "2024-11-13", rating: 4, text: "Bonne maîtrise du sujet, exemples pratiques utiles." },
        { date: "2024-11-14", rating: 2, text: "Horaires de consultation insuffisants, difficile de poser des questions." },
      ],
    },
  ],
  trend: [
    { semester: "S3 2022", c1: 3.6, c2: 3.2 },
    { semester: "S4 2023", c1: 3.9, c2: 3.5 },
    { semester: "S4 2024", c1: 4.0, c2: 3.6 },
    { semester: "S5 2024", c1: 4.2, c2: 3.8 },
  ],
};
