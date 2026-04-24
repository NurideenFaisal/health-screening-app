import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  beginAuthLoad: () =>
    set((state) => ({ ...state, loading: true })),

  setAuth: (user, profile) =>
    set({ user, profile, loading: false }),

  clearAuth: () =>
    set({ user: null, profile: null, loading: false }),
}))
