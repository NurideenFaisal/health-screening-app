import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  activeCycle: null,
  activeCycleError: null,

  setAuth: (user, profile) =>
    set({ user, profile, loading: false }),

  clearAuth: () =>
    set({ user: null, profile: null, loading: false, activeCycle: null, activeCycleError: null }),

  setActiveCycle: (activeCycle) =>
    set({ activeCycle, activeCycleError: null }),

  // Fetch and cache the active cycle - call once and reuse
  fetchActiveCycle: async () => {
    const { activeCycle } = get()
    // Return cached cycle if already fetched
    if (activeCycle) return activeCycle

    const { data, error } = await supabase
      .from('cycles')
      .select('id, name, is_active')
      .eq('is_active', true)
      .maybeSingle()

    if (!error && data) {
      set({ activeCycle: data, activeCycleError: null })
      return data
    }

    set({ activeCycleError: error ?? null })
    return null
  },

  // Clear cached cycle (useful when cycle changes)
  clearActiveCycle: () => set({ activeCycle: null, activeCycleError: null })
}))
