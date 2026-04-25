import { Bell, Search, Sparkles, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUIStore } from "@/stores/uiStore";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleLabel } from "./Sidebar";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);
  const { toggleNotifications, openCopilot } = useUIStore();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="h-full px-4 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <img src="/UCAR_logo.png" alt="UCAR Logo" className="h-10 w-auto object-contain drop-shadow-sm" />
          <div className="hidden sm:block">
            <div className="font-display font-semibold tracking-tight text-foreground leading-none">
              UCAR
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Université de Carthage
            </div>
          </div>
          <span className="hidden lg:inline-flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border border-border">
            <span className="size-1.5 rounded-full bg-gold" />
            {user.institutionName}
          </span>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              placeholder="Rechercher dans UCAR…"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/60 border border-transparent focus:border-gold focus:bg-background outline-none text-sm transition-colors"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={openCopilot}
            className="hidden sm:inline-flex gap-2 text-foreground hover:text-gold"
          >
            <Sparkles className="size-4 text-gold" />
            <span className="hidden md:inline">AI</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleNotifications}
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
                {unread}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="size-9 rounded-full ucar-gradient-navy text-gold flex items-center justify-center font-display font-semibold text-sm hover:ring-2 ring-gold/40 transition-all">
                {user.avatarInitials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{roleLabel(user.role)}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/student/profile" })}>
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
