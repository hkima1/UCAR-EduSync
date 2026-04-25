import { create } from "zustand";

type DrawerTab = "copilot" | "agents";

type State = {
  copilotOpen: boolean;
  notificationsOpen: boolean;
  messagingOpen: boolean;
  activeDrawerTab: DrawerTab;
  sidebarCollapsed: boolean;
  openCopilot: () => void;
  openAgents: () => void;
  closeDrawer: () => void;
  toggleNotifications: () => void;
  setMessagingOpen: (v: boolean) => void;
  toggleSidebar: () => void;
};

export const useUIStore = create<State>((set) => ({
  copilotOpen: false,
  notificationsOpen: false,
  messagingOpen: false,
  activeDrawerTab: "copilot",
  sidebarCollapsed: false,
  openCopilot: () => set({ copilotOpen: true, activeDrawerTab: "copilot" }),
  openAgents: () => set({ copilotOpen: true, activeDrawerTab: "agents" }),
  closeDrawer: () => set({ copilotOpen: false }),
  toggleNotifications: () =>
    set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  setMessagingOpen: (v) => set({ messagingOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
