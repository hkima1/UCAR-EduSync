import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import {
  GraduationCap,
  Home,
  Calendar,
  BookOpen,
  ClipboardCheck,
  FileText,
  Briefcase,
  Route as RouteIcon,
  PartyPopper,
  Files,
  MessageSquare,
  Users,
  PenSquare,
  BarChart3,
  Sparkles,
  CheckSquare,
  CalendarDays,
  Wallet,
  HeartHandshake,
  FlaskConical,
  Leaf,
  TrendingUp,
  Inbox,
  Building2,
  ShieldAlert,
  ChartBar,
  Globe2,
  Megaphone,
  Tag,
  Scale,
  LineChart,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from "lucide-react";
import type { ComponentType } from "react";
import type { Role } from "@/stores/authStore";

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string }> };

const NAV: Record<Role, NavItem[]> = {
  student: [
    { to: "/student/dashboard", label: "Tableau de bord", icon: Home },
    { to: "/student/schedule", label: "Emploi du temps", icon: Calendar },
    { to: "/student/grades", label: "Notes", icon: BookOpen },
    { to: "/student/attendance", label: "Présence", icon: ClipboardCheck },
    { to: "/student/enrollment", label: "Inscription", icon: FileText },
    { to: "/student/internships", label: "Stages & Bourses", icon: Briefcase },
    { to: "/student/educational-path", label: "Parcours", icon: RouteIcon },
    { to: "/student/forms", label: "Formulaires", icon: PenSquare },
    { to: "/student/student-life", label: "Vie étudiante", icon: PartyPopper },
    { to: "/student/documents", label: "Documents", icon: Files },
    { to: "/student/messages", label: "Messages", icon: MessageSquare },
  ],
  teacher: [
    { to: "/teacher/dashboard", label: "Tableau de bord", icon: Home },
    { to: "/teacher/attendance", label: "Présence", icon: ClipboardCheck },
    { to: "/teacher/grades", label: "Notes", icon: BookOpen },
    { to: "/teacher/exams", label: "Examens", icon: CalendarDays },
    { to: "/teacher/courses", label: "Cours", icon: BookOpen },
    { to: "/teacher/students", label: "Étudiants", icon: Users },
    { to: "/teacher/satisfaction", label: "Satisfaction", icon: ChartBar },
    { to: "/teacher/reports", label: "Rapports", icon: FileText },
    { to: "/teacher/messages", label: "Messages", icon: MessageSquare },
  ],
  institution_admin: [
    { to: "/admin/dashboard", label: "Tableau de bord", icon: Home },
    { to: "/admin/finance", label: "Finance", icon: Wallet },
    { to: "/admin/hr", label: "RH & Personnel", icon: Users },
    { to: "/admin/partnerships", label: "Partenariats", icon: HeartHandshake },
    { to: "/admin/research", label: "Recherche", icon: FlaskConical },
    { to: "/admin/esg", label: "ESG", icon: Leaf },
    { to: "/admin/strategic", label: "Analyse stratégique", icon: TrendingUp },
    { to: "/admin/demands", label: "Boîte de demandes", icon: Inbox },
    { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  ],
  director: [
    { to: "/director/dashboard", label: "Tableau de bord", icon: Home },
    { to: "/director/approvals", label: "File d'approbation", icon: CheckSquare },
    { to: "/director/staff", label: "Personnel", icon: Users },
    { to: "/director/academic", label: "Suivi académique", icon: BookOpen },
    { to: "/director/meetings", label: "Réunions", icon: CalendarDays },
    { to: "/director/financial", label: "Finance", icon: Wallet },
    { to: "/director/alerts", label: "Centre d'alertes", icon: ShieldAlert },
    { to: "/director/reports", label: "Rapports", icon: FileText },
    { to: "/director/messages", label: "Messages", icon: MessageSquare },
  ],
  super_admin: [
    { to: "/superadmin/dashboard", label: "Tableau de bord global", icon: Globe2 },
    { to: "/superadmin/institutions", label: "Établissements", icon: Building2 },
    { to: "/superadmin/employment-equity", label: "Équité d'emploi", icon: Scale },
    { to: "/superadmin/coordination", label: "Coordination", icon: Megaphone },
    { to: "/superadmin/offers", label: "Offres", icon: Tag },
    { to: "/superadmin/academic", label: "Suivi académique", icon: BookOpen },
    { to: "/superadmin/strategic", label: "Analyse stratégique", icon: TrendingUp },
    { to: "/superadmin/financial", label: "Finance", icon: Wallet },
    { to: "/superadmin/demands", label: "Demandes", icon: Inbox },
    { to: "/superadmin/predictions", label: "Prédictions", icon: LineChart },
    { to: "/superadmin/users", label: "Utilisateurs", icon: UserCog },
    { to: "/superadmin/messages", label: "Messages", icon: MessageSquare },
  ],
};

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, toggleSidebar, openCopilot, openAgents } = useUIStore();
  const location = useLocation();
  if (!user) return null;
  const items = NAV[user.role];
  const collapsed = sidebarCollapsed;

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200 sticky top-0 h-screen",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* UCAR Logo — prominent branding */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg bg-white flex items-center justify-center shrink-0 p-1.5", collapsed ? "size-9" : "size-12")}>
            <img
              src="/UCAR_logo.png"
              alt="Université de Carthage"
              className="h-full w-auto object-contain"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display font-bold text-sm text-white leading-none tracking-tight">
                Université de Carthage
              </div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/50 mt-0.5">
                Carthage Connect
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-sidebar-border flex items-center gap-3">
        <div className="size-8 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
          {user.avatarInitials}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
              {roleLabel(user.role)}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative",
                active
                  ? "text-gold bg-sidebar-accent"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-gold rounded-full" />
              )}
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <button
          onClick={openCopilot}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:text-gold hover:bg-sidebar-accent transition-colors"
        >
          <Sparkles className="size-4 shrink-0 text-gold" />
          {!collapsed && <span>AI Copilot</span>}
        </button>
        <button
          onClick={openAgents}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:text-gold hover:bg-sidebar-accent transition-colors"
        >
          <Bot className="size-4 shrink-0 text-gold" />
          {!collapsed && <span>Tâches d'agents</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" />
          ) : (
            <PanelLeftClose className="size-4 shrink-0" />
          )}
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  );
}

export function roleLabel(r: Role) {
  return {
    student: "Étudiant",
    teacher: "Enseignant",
    institution_admin: "Admin établissement",
    director: "Directeur",
    super_admin: "UCAR Super Admin",
  }[r];
}
