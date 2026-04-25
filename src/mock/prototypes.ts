export type PrototypeStatus = "todo" | "running" | "done";
export type PrototypePriority = "low" | "medium" | "high";

export type PrototypeRecord = {
  id: string;
  feature: string;
  title: string;
  owner: string;
  status: PrototypeStatus;
  priority: PrototypePriority;
  score: number;
  updatedLabel: string;
};

const STATUS_FLOW: PrototypeStatus[] = ["todo", "running", "done"];

const OWNER_POOLS = {
  student: ["Bureau scolarite", "Service pedagogique", "Conseiller etudiant"],
  teacher: ["Chef departement", "Coordinateur cours", "Cellule evaluation"],
  admin: ["Direction administrative", "Service qualite", "Cellule finance"],
  director: ["Cabinet direction", "Cellule pilotage", "Comite gouvernance"],
  superadmin: ["UCAR central", "Coordination nationale", "Cellule IA UCAR"],
};

type OwnerPoolKey = keyof typeof OWNER_POOLS;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seedInput: string): () => number {
  let seed = hashSeed(seedInput) || 1;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)] as T;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function resolveOwnerPoolKey(eyebrow: string): OwnerPoolKey {
  const text = eyebrow.toLowerCase();
  if (text.includes("etudiant")) return "student";
  if (text.includes("enseignant")) return "teacher";
  if (text.includes("direction")) return "director";
  if (text.includes("ucar")) return "superadmin";
  return "admin";
}

export function statusLabel(status: PrototypeStatus): string {
  return {
    todo: "A traiter",
    running: "En cours",
    done: "Livre",
  }[status];
}

export function nextStatus(status: PrototypeStatus): PrototypeStatus {
  const index = STATUS_FLOW.indexOf(status);
  return STATUS_FLOW[(index + 1) % STATUS_FLOW.length];
}

export function buildPrototypeRecords(options: {
  title: string;
  eyebrow: string;
  features: string[];
}): PrototypeRecord[] {
  const { title, eyebrow } = options;
  const features = options.features.length
    ? options.features
    : ["Pilotage", "Qualite", "Execution"];

  const rng = createRng(`${title}-${eyebrow}-${features.join("|")}`);
  const ownerPool = OWNER_POOLS[resolveOwnerPoolKey(eyebrow)];
  const targetCount = Math.min(16, Math.max(8, features.length * 3));
  const records: PrototypeRecord[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const feature = features[index % features.length] ?? "Pilotage";
    const random = rng();
    const status: PrototypeStatus =
      random < 0.36 ? "todo" : random < 0.78 ? "running" : "done";
    const priority: PrototypePriority =
      random < 0.2 ? "high" : random < 0.62 ? "medium" : "low";
    const score = Math.round(58 + rng() * 40);
    const owner = pick(rng, ownerPool);

    records.push({
      id: `${slugify(feature)}-${index + 1}`,
      feature,
      title: `${feature} - lot ${index + 1}`,
      owner,
      status,
      priority,
      score,
      updatedLabel: `J-${Math.floor(rng() * 12) + 1}`,
    });
  }

  return records;
}
