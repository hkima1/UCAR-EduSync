import { create } from "zustand";
import { seedNotifications, type AppNotification } from "@/mock/notifications";

type State = {
  notifications: AppNotification[];
  unreadCount: () => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  add: (n: Omit<AppNotification, "id" | "timestamp" | "read"> & { read?: boolean }) => void;
};

export const useNotificationStore = create<State>((set, get) => ({
  notifications: seedNotifications,
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  dismiss: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  add: (n) =>
    set((s) => ({
      notifications: [
        {
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
          read: n.read ?? false,
          ...n,
        },
        ...s.notifications,
      ],
    })),
}));
