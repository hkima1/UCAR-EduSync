import { useAuthStore, type Role } from "@/stores/authStore";
import { Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { CopilotDrawer } from "./CopilotDrawer";
import { NotificationPanel } from "./NotificationPanel";
import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notificationStore";

const LIVE_NOTIFS = [
  { type: "alert" as const, priority: "info" as const, title: "Nouveau classement", body: "Mise à jour des classements semestriels disponible." },
  { type: "message" as const, priority: "info" as const, title: "Message administratif", body: "Réunion pédagogique programmée." },
  { type: "report" as const, priority: "info" as const, title: "Rapport généré", body: "Synthèse hebdomadaire prête." },
];

function roleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/admin")) return "institution_admin";
  if (pathname.startsWith("/director")) return "director";
  if (pathname.startsWith("/superadmin")) return "super_admin";
  return null;
}

export function AppShell() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const loginAs = useAuthStore((s) => s.loginAs);
  const add = useNotificationStore((s) => s.add);
  const expectedRole = roleFromPath(location.pathname);

  useEffect(() => {
    if (expectedRole && user?.role !== expectedRole) {
      loginAs(expectedRole);
    }
  }, [expectedRole, loginAs, user?.role]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => {
      const n = LIVE_NOTIFS[Math.floor(Math.random() * LIVE_NOTIFS.length)];
      add(n);
    }, 45000);
    return () => clearInterval(id);
  }, [user, add]);

  if (expectedRole && user?.role !== expectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Chargement de l'espace...
      </div>
    );
  }

  if (!user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <CopilotDrawer />
      <NotificationPanel />
    </div>
  );
}
