export type Student = {
  id: string;
  name: string;
  email: string;
  institutionId: string;
  field: string;
  semester: number;
  gpa: number;
  attendanceRate: number;
  credits: number;
  totalCredits: number;
};

export const students: Student[] = [
  { id: "s1", name: "Yasmine Ben Salah", email: "yasmine.bensalah@enit.utc.tn", institutionId: "enit", field: "Génie Informatique", semester: 5, gpa: 14.2, attendanceRate: 88, credits: 132, totalCredits: 180 },
  { id: "s2", name: "Mohamed Trabelsi", email: "mohamed.trabelsi@insat.utc.tn", institutionId: "insat", field: "Réseaux & Télécoms", semester: 6, gpa: 13.4, attendanceRate: 76, credits: 158, totalCredits: 180 },
  { id: "s3", name: "Salma Khelifi", email: "salma.khelifi@isamm.utc.tn", institutionId: "isamm", field: "Multimédia & Web", semester: 4, gpa: 15.8, attendanceRate: 94, credits: 102, totalCredits: 180 },
  { id: "s4", name: "Karim Bouazizi", email: "karim.bouazizi@iset-nabeul.utc.tn", institutionId: "iset-nabeul", field: "Génie Mécanique", semester: 3, gpa: 11.6, attendanceRate: 64, credits: 72, totalCredits: 180 },
  { id: "s5", name: "Nour Ben Amor", email: "nour.benamor@ihec.utc.tn", institutionId: "ihec", field: "Finance", semester: 5, gpa: 16.1, attendanceRate: 92, credits: 138, totalCredits: 180 },
  { id: "s6", name: "Aymen Gharbi", email: "aymen.gharbi@enit.utc.tn", institutionId: "enit", field: "Génie Civil", semester: 7, gpa: 12.8, attendanceRate: 71, credits: 184, totalCredits: 240 },
  { id: "s7", name: "Rim Mejri", email: "rim.mejri@fst.utc.tn", institutionId: "fst", field: "Mathématiques", semester: 5, gpa: 14.7, attendanceRate: 86, credits: 130, totalCredits: 180 },
  { id: "s8", name: "Wassim Hammami", email: "wassim.hammami@isit.utc.tn", institutionId: "isit", field: "Cybersécurité", semester: 4, gpa: 13.2, attendanceRate: 79, credits: 98, totalCredits: 180 },
];

export const currentStudent = students[0];

export type Grade = {
  course: string;
  code: string;
  credits: number;
  grade: number;
  max: number;
  semester: number;
};

export const studentGrades: Grade[] = [
  { course: "Algorithmique avancée", code: "INF301", credits: 6, grade: 15.5, max: 20, semester: 5 },
  { course: "Bases de données", code: "INF302", credits: 5, grade: 14, max: 20, semester: 5 },
  { course: "Réseaux", code: "INF303", credits: 4, grade: 12.5, max: 20, semester: 5 },
  { course: "Anglais technique", code: "LAN301", credits: 2, grade: 16, max: 20, semester: 5 },
  { course: "Génie logiciel", code: "INF304", credits: 5, grade: 13, max: 20, semester: 5 },
  { course: "Systèmes d'exploitation", code: "INF205", credits: 5, grade: 11.5, max: 20, semester: 4 },
  { course: "Programmation orientée objet", code: "INF204", credits: 5, grade: 14.5, max: 20, semester: 4 },
  { course: "Mathématiques discrètes", code: "MAT201", credits: 4, grade: 13, max: 20, semester: 4 },
];

export const gpaTrend = [
  { semester: "S1", gpa: 12.4 },
  { semester: "S2", gpa: 13.1 },
  { semester: "S3", gpa: 13.6 },
  { semester: "S4", gpa: 13.9 },
  { semester: "S5", gpa: 14.2 },
];

export type ScheduleSlot = {
  day: number; // 0 = Mon
  start: number; // hour
  end: number;
  course: string;
  room: string;
  professor: string;
  color: string;
};

export const studentSchedule: ScheduleSlot[] = [
  { day: 0, start: 8, end: 10, course: "Algorithmique avancée", room: "B204", professor: "Dr. Ben Younès", color: "navy" },
  { day: 0, start: 10, end: 12, course: "Bases de données", room: "B105", professor: "Dr. Chaabane", color: "gold" },
  { day: 1, start: 9, end: 11, course: "Réseaux", room: "Lab 3", professor: "Dr. Ferchichi", color: "info" },
  { day: 1, start: 14, end: 16, course: "Génie logiciel", room: "B301", professor: "Dr. Khaldi", color: "success" },
  { day: 2, start: 8, end: 10, course: "Anglais technique", room: "A102", professor: "Mme. Souissi", color: "warning" },
  { day: 2, start: 13, end: 16, course: "Projet intégré", room: "Atelier 2", professor: "Dr. Ben Younès", color: "navy" },
  { day: 3, start: 10, end: 12, course: "Bases de données TP", room: "Lab 1", professor: "Dr. Chaabane", color: "gold" },
  { day: 4, start: 9, end: 11, course: "Algorithmique TD", room: "B204", professor: "M. Hamdi", color: "navy" },
  { day: 4, start: 14, end: 17, course: "Génie logiciel — Projet", room: "B301", professor: "Dr. Khaldi", color: "success" },
];

export type Absence = {
  date: string;
  course: string;
  type: "Cours" | "TD" | "TP";
  status: "Justifiée" | "Non justifiée";
};

export const studentAbsences: Absence[] = [
  { date: "2024-11-04", course: "Réseaux", type: "Cours", status: "Justifiée" },
  { date: "2024-11-11", course: "Génie logiciel", type: "TP", status: "Non justifiée" },
  { date: "2024-11-18", course: "Bases de données", type: "TD", status: "Justifiée" },
  { date: "2024-11-25", course: "Anglais technique", type: "Cours", status: "Non justifiée" },
];

export const upcomingExams = [
  { course: "Algorithmique avancée", date: "2024-12-12", time: "08:30", room: "Amphi A" },
  { course: "Bases de données", date: "2024-12-15", time: "10:00", room: "Amphi B" },
  { course: "Réseaux", date: "2024-12-18", time: "14:00", room: "B204" },
];
