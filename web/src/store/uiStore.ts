import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============================================================
// UI Store (Zustand)
// Sidebar state, active modals, theme — NEVER server data
// ============================================================

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

interface UIState {
  sidebarOpen: boolean
  activeModal: string | null
  theme: 'light' | 'dark'
  toasts: ToastItem[]
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (id: string) => void
  closeModal: () => void
  toggleTheme: () => void
  showToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      activeModal: null,
      theme: 'light',
      toasts: [],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      openModal: (id) => set({ activeModal: id }),
      closeModal: () => set({ activeModal: null }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      showToast: (toast) => set((state) => ({
        toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
      })),
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
    }),
    {
      name: 'deskline-ui-store',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme, not sidebar state
    }
  )
)
