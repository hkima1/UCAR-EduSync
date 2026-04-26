import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type Role =
  | "student"
  | "teacher"
  | "institution_admin"
  | "director"
  | "super_admin"
  | "ucar_admin";

export type AuthUser = {
  id: string;
  name: string;
  role: Role;
  institutionId: string;
  institutionName: string;
  avatarInitials: string;
  email: string;
  picture?: string;
};

type AuthState = {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
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
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("ucar-access-token");
          localStorage.removeItem("ucar-refresh-token");
        }
        set({ user: null });
      },
    }),
    { name: "ucar-auth", storage: authStorage },
  ),
);
