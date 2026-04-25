export type Institution = {
  id: string;
  name: string;
  shortName: string;
  type: "ISET" | "ENIT" | "Faculty" | "Institute" | "School";
  region: string;
  enrollment: number;
  staffCount: number;
  teacherCount: number;
  budgetAllocated: number;
  budgetConsumed: number;
  passRate: number;
  esgScore: number;
};

export const institutions: Institution[] = [
  { id: "enit", name: "École Nationale d'Ingénieurs de Tunis", shortName: "ENIT", type: "ENIT", region: "Tunis", enrollment: 2840, staffCount: 410, teacherCount: 198, budgetAllocated: 18_400_000, budgetConsumed: 12_180_000, passRate: 87, esgScore: 78 },
  { id: "iset-nabeul", name: "Institut Supérieur des Études Technologiques de Nabeul", shortName: "ISET Nabeul", type: "ISET", region: "Nabeul", enrollment: 3120, staffCount: 220, teacherCount: 102, budgetAllocated: 9_200_000, budgetConsumed: 8_410_000, passRate: 71, esgScore: 64 },
  { id: "esst", name: "École Supérieure des Sciences et Technologies", shortName: "ESST", type: "School", region: "Hammam Sousse", enrollment: 1980, staffCount: 180, teacherCount: 96, budgetAllocated: 8_700_000, budgetConsumed: 6_120_000, passRate: 79, esgScore: 71 },
  { id: "fst", name: "Faculté des Sciences de Tunis", shortName: "FST Tunis", type: "Faculty", region: "Tunis", enrollment: 6450, staffCount: 540, teacherCount: 312, budgetAllocated: 22_800_000, budgetConsumed: 19_440_000, passRate: 68, esgScore: 60 },
  { id: "insat", name: "Institut National des Sciences Appliquées et de Technologie", shortName: "INSAT", type: "Institute", region: "Tunis", enrollment: 3540, staffCount: 380, teacherCount: 188, budgetAllocated: 16_200_000, budgetConsumed: 14_580_000, passRate: 84, esgScore: 75 },
  { id: "isg-tunis", name: "Institut Supérieur de Gestion de Tunis", shortName: "ISG Tunis", type: "Institute", region: "Tunis", enrollment: 4120, staffCount: 290, teacherCount: 164, budgetAllocated: 11_400_000, budgetConsumed: 9_300_000, passRate: 76, esgScore: 69 },
  { id: "ihec", name: "Institut des Hautes Études Commerciales de Carthage", shortName: "IHEC Carthage", type: "Institute", region: "Carthage", enrollment: 3680, staffCount: 260, teacherCount: 142, budgetAllocated: 12_900_000, budgetConsumed: 11_180_000, passRate: 81, esgScore: 73 },
  { id: "isit", name: "Institut Supérieur d'Informatique et des Technologies", shortName: "ISIT", type: "Institute", region: "Ariana", enrollment: 2210, staffCount: 175, teacherCount: 98, budgetAllocated: 7_800_000, budgetConsumed: 6_850_000, passRate: 74, esgScore: 66 },
  { id: "isamm", name: "Institut Supérieur des Arts Multimédia de la Manouba", shortName: "ISAMM", type: "Institute", region: "Manouba", enrollment: 1450, staffCount: 130, teacherCount: 72, budgetAllocated: 5_400_000, budgetConsumed: 4_780_000, passRate: 82, esgScore: 70 },
  { id: "isi", name: "Institut Supérieur d'Informatique", shortName: "ISI Ariana", type: "Institute", region: "Ariana", enrollment: 2680, staffCount: 195, teacherCount: 110, budgetAllocated: 8_900_000, budgetConsumed: 7_200_000, passRate: 73, esgScore: 65 },
  { id: "fmt", name: "Faculté de Médecine de Tunis", shortName: "FMT", type: "Faculty", region: "Tunis", enrollment: 5400, staffCount: 620, teacherCount: 354, budgetAllocated: 28_500_000, budgetConsumed: 24_120_000, passRate: 89, esgScore: 81 },
  { id: "fseg", name: "Faculté des Sciences Économiques et de Gestion", shortName: "FSEG Tunis", type: "Faculty", region: "Tunis", enrollment: 5870, staffCount: 380, teacherCount: 218, budgetAllocated: 14_800_000, budgetConsumed: 12_640_000, passRate: 70, esgScore: 62 },
  { id: "iset-rades", name: "ISET de Radès", shortName: "ISET Radès", type: "ISET", region: "Ben Arous", enrollment: 2540, staffCount: 178, teacherCount: 88, budgetAllocated: 7_200_000, budgetConsumed: 6_180_000, passRate: 69, esgScore: 61 },
  { id: "iset-charguia", name: "ISET de Charguia", shortName: "ISET Charguia", type: "ISET", region: "Tunis", enrollment: 1980, staffCount: 142, teacherCount: 78, budgetAllocated: 5_900_000, budgetConsumed: 5_120_000, passRate: 72, esgScore: 63 },
  { id: "iset-mahdia", name: "ISET de Mahdia", shortName: "ISET Mahdia", type: "ISET", region: "Mahdia", enrollment: 1420, staffCount: 98, teacherCount: 54, budgetAllocated: 4_200_000, budgetConsumed: 3_780_000, passRate: 67, esgScore: 58 },
  { id: "isb", name: "Institut Supérieur de Biotechnologie", shortName: "ISB Sidi Thabet", type: "Institute", region: "Ariana", enrollment: 980, staffCount: 110, teacherCount: 64, budgetAllocated: 6_400_000, budgetConsumed: 5_120_000, passRate: 85, esgScore: 77 },
  { id: "ipest", name: "Institut Préparatoire aux Études Scientifiques", shortName: "IPEST", type: "Institute", region: "La Marsa", enrollment: 720, staffCount: 95, teacherCount: 68, budgetAllocated: 5_800_000, budgetConsumed: 4_980_000, passRate: 92, esgScore: 80 },
  { id: "essths", name: "École Supérieure des Sciences et Techniques de la Santé", shortName: "ESSTHS", type: "School", region: "Sousse", enrollment: 2180, staffCount: 198, teacherCount: 118, budgetAllocated: 9_400_000, budgetConsumed: 8_120_000, passRate: 83, esgScore: 72 },
  { id: "isd", name: "Institut Supérieur de Documentation", shortName: "ISD Manouba", type: "Institute", region: "Manouba", enrollment: 1180, staffCount: 88, teacherCount: 48, budgetAllocated: 3_900_000, budgetConsumed: 3_320_000, passRate: 78, esgScore: 67 },
  { id: "isspt", name: "Institut Supérieur des Sciences Paramédicales de Tunis", shortName: "ISSPT", type: "Institute", region: "Tunis", enrollment: 1640, staffCount: 142, teacherCount: 84, budgetAllocated: 6_800_000, budgetConsumed: 5_940_000, passRate: 86, esgScore: 74 },
  { id: "fdspt", name: "Faculté de Droit et des Sciences Politiques", shortName: "FDSPT", type: "Faculty", region: "Tunis", enrollment: 4980, staffCount: 310, teacherCount: 176, budgetAllocated: 11_200_000, budgetConsumed: 9_840_000, passRate: 65, esgScore: 59 },
  { id: "esct", name: "École Supérieure de Commerce de Tunis", shortName: "ESCT", type: "School", region: "Manouba", enrollment: 2840, staffCount: 198, teacherCount: 114, budgetAllocated: 8_600_000, budgetConsumed: 7_320_000, passRate: 77, esgScore: 68 },
  { id: "ent", name: "École Nationale de Technologie", shortName: "ENT", type: "School", region: "Borj Cédria", enrollment: 1820, staffCount: 158, teacherCount: 92, budgetAllocated: 7_400_000, budgetConsumed: 6_180_000, passRate: 80, esgScore: 70 },
  { id: "fmd", name: "Faculté de Médecine Dentaire", shortName: "FMD Monastir", type: "Faculty", region: "Monastir", enrollment: 1240, staffCount: 168, teacherCount: 98, budgetAllocated: 9_800_000, budgetConsumed: 8_420_000, passRate: 88, esgScore: 76 },
  { id: "isamb", name: "Institut Supérieur d'Architecture et des Métiers du Bâtiment", shortName: "ISAMB", type: "Institute", region: "Tunis", enrollment: 1340, staffCount: 118, teacherCount: 68, budgetAllocated: 5_600_000, budgetConsumed: 4_820_000, passRate: 75, esgScore: 66 },
  { id: "isjeg", name: "Institut Supérieur de Journalisme", shortName: "IPSI", type: "Institute", region: "Manouba", enrollment: 940, staffCount: 78, teacherCount: 42, budgetAllocated: 3_400_000, budgetConsumed: 2_960_000, passRate: 79, esgScore: 68 },
  { id: "ennb", name: "École Nationale de Médecine Vétérinaire", shortName: "ENMV", type: "School", region: "Sidi Thabet", enrollment: 880, staffCount: 122, teacherCount: 72, budgetAllocated: 7_200_000, budgetConsumed: 6_080_000, passRate: 84, esgScore: 75 },
  { id: "isg-sousse", name: "Institut Supérieur de Gestion de Sousse", shortName: "ISG Sousse", type: "Institute", region: "Sousse", enrollment: 3240, staffCount: 218, teacherCount: 124, budgetAllocated: 9_600_000, budgetConsumed: 8_180_000, passRate: 73, esgScore: 64 },
  { id: "iseah", name: "Institut Supérieur des Études Appliquées en Humanités", shortName: "ISEAH", type: "Institute", region: "Mahdia", enrollment: 1520, staffCount: 110, teacherCount: 64, budgetAllocated: 4_600_000, budgetConsumed: 3_980_000, passRate: 70, esgScore: 62 },
  { id: "iss", name: "Institut Supérieur du Sport et de l'Éducation Physique", shortName: "ISSEP Ksar Saïd", type: "Institute", region: "Ksar Saïd", enrollment: 1180, staffCount: 92, teacherCount: 56, budgetAllocated: 4_200_000, budgetConsumed: 3_640_000, passRate: 81, esgScore: 71 },
];

export const getInstitution = (id: string) =>
  institutions.find((i) => i.id === id) ?? institutions[0];
