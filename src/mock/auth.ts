/**
 * UCAR Authentication — Mock credential store
 * Simulates a SQL `users` table with hashed passwords and 2FA secrets.
 * In production, this would be a Supabase `auth.users` + `public.user_profiles` table.
 *
 * SQL equivalent:
 * SELECT id, email, name, role, institution_id, totp_enabled
 * FROM users
 * WHERE email = $1 AND password_hash = crypt($2, password_hash);
 */

import type { Role } from "@/stores/authStore";

export type MockCredential = {
  id: string;
  email: string;
  password: string; // In production: bcrypt hash
  name: string;
  role: Role;
  institutionId: string;
  institutionName: string;
  avatarInitials: string;
  totpEnabled: boolean;
  totpSecret: string; // 6-digit static code for demo
};

export const MOCK_USERS: MockCredential[] = [
  {
    id: "s1",
    email: "yasmine.bensalah@enit.utc.tn",
    password: "Etudiant@2025",
    name: "Yasmine Ben Salah",
    role: "student",
    institutionId: "enit",
    institutionName: "ENIT",
    avatarInitials: "YB",
    totpEnabled: true,
    totpSecret: "482916",
  },
  {
    id: "t1",
    email: "s.benyounes@enit.utc.tn",
    password: "Enseignant@2025",
    name: "Dr. Slim Ben Younès",
    role: "teacher",
    institutionId: "enit",
    institutionName: "ENIT",
    avatarInitials: "SB",
    totpEnabled: true,
    totpSecret: "713054",
  },
  {
    id: "a1",
    email: "h.jaziri@insat.utc.tn",
    password: "Admin@2025",
    name: "Mme. Hela Jaziri",
    role: "institution_admin",
    institutionId: "insat",
    institutionName: "INSAT",
    avatarInitials: "HJ",
    totpEnabled: true,
    totpSecret: "295637",
  },
  {
    id: "d1",
    email: "a.belhaj@ihec.utc.tn",
    password: "Directeur@2025",
    name: "Pr. Anis Belhaj",
    role: "director",
    institutionId: "ihec",
    institutionName: "IHEC Carthage",
    avatarInitials: "AB",
    totpEnabled: true,
    totpSecret: "861428",
  },
  {
    id: "sa1",
    email: "f.marzouki@ucar.tn",
    password: "SuperAdmin@2025",
    name: "Pr. Faouzi Marzouki",
    role: "super_admin",
    institutionId: "ucar",
    institutionName: "Université de Carthage",
    avatarInitials: "FM",
    totpEnabled: true,
    totpSecret: "537190",
  },
];

/**
 * Simulates: SELECT * FROM users WHERE email = $1 AND password_hash = crypt($2, password_hash)
 * Returns the user if credentials match, null otherwise.
 */
export function authenticateUser(email: string, password: string): MockCredential | null {
  const normalized = email.trim().toLowerCase();
  return MOCK_USERS.find(
    (u) => u.email.toLowerCase() === normalized && u.password === password
  ) ?? null;
}

/**
 * Simulates: SELECT totp_enabled FROM users WHERE id = $1
 */
export function checkTotpEnabled(userId: string): boolean {
  return MOCK_USERS.find((u) => u.id === userId)?.totpEnabled ?? false;
}

/**
 * Simulates: SELECT 1 FROM user_totp WHERE user_id = $1 AND code = $2
 * Validates the 6-digit TOTP code.
 */
export function validateTotp(userId: string, code: string): boolean {
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return false;
  return user.totpSecret === code.trim();
}
