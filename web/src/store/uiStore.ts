import { create } from 'zustand'

// ============================================================
// UI Store (Zustand)
// Sidebar state, active modals — NEVER server data
// ============================================================

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  sidebarOpen: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}))
