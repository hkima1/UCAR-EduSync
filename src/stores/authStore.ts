import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type Role =
  | "student"
  | "teacher"
  | "institution_admin"
  | "director"
<<<<<<< HEAD
  | "super_admin";
=======
  | "super_admin"
  | "ucar_admin";
>>>>>>> 3e2ec72 (aa)

export type AuthUser = {
  id: string;
  name: string;
  role: Role;
  institutionId: string;
  institutionName: string;
  avatarInitials: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  loginAs: (role: Role) => void; // kept for backward compat
  logout: () => void;
};

const serverStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const authStorage = createJSONStorage<AuthState>(() =>
  typeof window !== "undefined" ? window.localStorage : serverStorage,
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      loginAs: (role) => {
        // Fallback: quick role switch (for testing only)
        const profiles: Record<Role, Omit<AuthUser, "role">> = {
          student: { id: "s1", name: "Yasmine Ben Salah", institutionId: "enit", institutionName: "ENIT", avatarInitials: "YB", email: "yasmine.bensalah@enit.utc.tn" },
          teacher: { id: "t1", name: "Dr. Slim Ben Younès", institutionId: "enit", institutionName: "ENIT", avatarInitials: "SB", email: "s.benyounes@enit.utc.tn" },
          institution_admin: { id: "a1", name: "Mme. Hela Jaziri", institutionId: "insat", institutionName: "INSAT", avatarInitials: "HJ", email: "h.jaziri@insat.utc.tn" },
          director: { id: "d1", name: "Pr. Anis Belhaj", institutionId: "ihec", institutionName: "IHEC Carthage", avatarInitials: "AB", email: "a.belhaj@ihec.utc.tn" },
          super_admin: { id: "sa1", name: "Pr. Faouzi Marzouki", institutionId: "ucar", institutionName: "Université de Carthage", avatarInitials: "FM", email: "f.marzouki@ucar.tn" },
<<<<<<< HEAD
        };
        set({ user: { role, ...profiles[role] } });
      },
      logout: () => set({ user: null }),
=======
          ucar_admin: { id: "ua1", name: "Pr. Faouzi Marzouki", institutionId: "ucar", institutionName: "Université de Carthage", avatarInitials: "FM", email: "f.marzouki@ucar.tn" },
        };
        set({ user: { role, ...profiles[role] } });
      },
      logout: () => {
        // Clear JWT tokens on logout
        if (typeof window !== "undefined") {
          localStorage.removeItem("ucar-access-token");
          localStorage.removeItem("ucar-refresh-token");
        }
        set({ user: null });
      },
>>>>>>> 3e2ec72 (aa)
    }),
    { name: "ucar-auth", storage: authStorage },
  ),
);
