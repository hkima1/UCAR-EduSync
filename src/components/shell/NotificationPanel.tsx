import { useUIStore } from "@/stores/uiStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { cn } from "@/lib/utils";
import { Bell, X, AlertTriangle, Info, CheckCircle2, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "@/lib/format";

const TABS = [
  { id: "all", label: "Tous" },
  { id: "alert", label: "Alertes" },
  { id: "task", label: "Tâches" },
  { id: "message", label: "Messages" },
  { id: "report", label: "Rapports" },
] as const;

export function NotificationPanel() {
  const open = useUIStore((s) => s.notificationsOpen);
  const toggle = useUIStore((s) => s.toggleNotifications);
  const { notifications, markAllRead, markRead, dismiss } = useNotificationStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");

  const filtered = tab === "all" ? notifications : notifications.filter((n) => n.type === tab);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={toggle}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 h-screen w-full sm:w-96 bg-card border-l border-border z-50 shadow-2xl flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-gold" />
            <span className="font-display font-semibold text-sm">Centre de notifications</span>
          </div>
          <button onClick={toggle} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-4 pt-3 flex gap-1 border-b border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap",
                tab === t.id
                  ? "border-gold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 flex justify-between items-center border-b border-border">
          <span className="text-xs text-muted-foreground">{filtered.length} élément(s)</span>
          <button onClick={markAllRead} className="text-xs text-gold hover:underline">
            Tout marquer lu
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Aucune notification</div>
          ) : (
            filtered.map((n) => {
              const Icon =
                n.type === "alert"
                  ? AlertTriangle
                  : n.type === "task"
                    ? CheckCircle2
                    : n.type === "report"
                      ? FileText
                      : n.type === "message"
                        ? MessageSquare
                        : Info;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 hover:bg-muted/40 transition-colors cursor-pointer",
                    !n.read && "bg-gold/5",
                  )}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "size-8 rounded-md flex items-center justify-center shrink-0",
                        n.priority === "critical"
                          ? "bg-destructive/10 text-destructive"
                          : n.priority === "warning"
                            ? "bg-warning/10 text-warning"
                            : "bg-info/10 text-info",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{n.title}</span>
                        {!n.read && <span className="size-1.5 rounded-full bg-gold shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {formatDistanceToNow(n.timestamp)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismiss(n.id);
                          }}
                          className="text-[10px] text-muted-foreground hover:text-destructive"
                        >
                          Ignorer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
