import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================
// UI Store (Zustand)
// Sidebar state, active modals, theme — NEVER server data
// ============================================================

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  theme: 'light' | 'dark'
  toastMessage: string | null
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  toggleTheme: () => void
  showToast: (message: string) => void
  clearToast: () => void
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      activeModal: null,
      theme: 'light',
      toastMessage: null,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      showToast: (message) => set({ toastMessage: message }),
      clearToast: () => set({ toastMessage: null }),
    }),
    {
      name: 'deskline-ui-store',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme, not sidebar state
    }
  )
)
