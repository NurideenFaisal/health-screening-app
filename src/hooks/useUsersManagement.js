import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Local Storage Keys
const STORAGE_KEY = 'roleManagement_users'
const STORAGE_TIMESTAMP = 'roleManagement_timestamp'

// Local Storage Helpers
const saveToCache = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    localStorage.setItem(STORAGE_TIMESTAMP, Date.now().toString())
  } catch (err) {
    console.warn('Failed to save to localStorage:', err)
  }
}

const loadFromCache = () => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY)
    return cached ? JSON.parse(cached) : []
  } catch (err) {
    console.warn('Failed to load from localStorage:', err)
    return []
  }
}

// Helper Functions
export const getInitial = (name) => name?.charAt(0).toUpperCase() || '?'

export const getRoleColor = (role) =>
  role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'

export const getSectionOption = (sectionOptions, sectionNumber) =>
  sectionOptions.find(option => option.value === String(sectionNumber))

// Main Hook
export function useUsersManagement() {
  const { profile } = useAuthStore()
  const isClinicAdmin = profile?.role === 'admin' && profile?.clinic_id

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, role, section, section_number, clinic_id')
        .order('created_at', { ascending: false })

      // For clinic admins: filter by their clinic_id AND exclude super-admin
      if (isClinicAdmin && profile?.clinic_id) {
        query = query
          .eq('clinic_id', profile.clinic_id)
          .neq('role', 'super-admin')
      }
      // For super-admin: show all users (no filter)

      const { data, error } = await query

      if (error) {
        console.error('Failed to load users:', error.message)
      } else {
        setUsers(data || [])
        saveToCache(data || [])
      }
    } catch (err) {
      console.error('Network error loading users:', err)
    } finally {
      setLoading(false)
    }
  }, [isClinicAdmin, profile?.clinic_id])

  // Filtered Users
  const filtered = useMemo(() =>
    users.filter(u =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [users, searchQuery])

  // Real-time Subscription Setup
  useEffect(() => {
    // Load cached data immediately
    const cachedUsers = loadFromCache()
    if (cachedUsers.length > 0) {
      setUsers(cachedUsers)
      setLoading(false)
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('Real-time update:', payload)
        fetchUsers() // Refresh data when changes occur
      })
      .subscribe()

    const cleanup = () => {
      supabase.removeChannel(channel)
    }

    // Fetch fresh data in background
    fetchUsers()

    return cleanup
  }, [fetchUsers])

  return {
    users,
    loading,
    searchQuery,
    setSearchQuery,
    filtered,
    fetchUsers,
  }
}
