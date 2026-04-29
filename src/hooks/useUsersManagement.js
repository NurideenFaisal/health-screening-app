import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

const STORAGE_KEY = 'roleManagement_users'
const STORAGE_TIMESTAMP = 'roleManagement_timestamp'

const saveToCache = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); localStorage.setItem(STORAGE_TIMESTAMP, Date.now().toString()) } catch (err) { console.warn('Failed to save to localStorage:', err) } }
const loadFromCache = () => { try { const cached = localStorage.getItem(STORAGE_KEY); return cached ? JSON.parse(cached) : [] } catch (err) { console.warn('Failed to load from localStorage:', err); return [] } }

export const getInitial = (name) => name?.charAt(0).toUpperCase() || '?'
export const getRoleColor = (role) => role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
export const getSectionOption = (sectionOptions, sectionNumber) => sectionOptions.find(option => option.value === String(sectionNumber))

export function useUsersManagement() {
  const { profile } = useAuthStore()
  const isClinicAdmin = profile?.role === 'admin' && profile?.clinic_id
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      let query = supabase.from('profiles').select('id, full_name, role, assigned_sections, clinic_id, is_active').order('created_at', { ascending: false })
      if (isClinicAdmin && profile?.clinic_id) { query = query.eq('clinic_id', profile.clinic_id).neq('role', 'super-admin') }
      const { data, error } = await query
      if (error) { console.error('Failed to load users:', error.message) } else { setUsers(data || []); saveToCache(data || []) }
    } catch (err) { console.error('Network error loading users:', err) } finally { setLoading(false) }
  }, [isClinicAdmin, profile?.clinic_id])

  const filtered = useMemo(() => users.filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())), [users, searchQuery])

  useEffect(() => {
    const cachedUsers = loadFromCache()
    if (cachedUsers.length > 0) { setUsers(cachedUsers); setLoading(false) }
    const channel = supabase.channel('profiles_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers()).subscribe()
    fetchUsers()
    return () => { supabase.removeChannel(channel) }
  }, [fetchUsers])

  return { users, loading, searchQuery, setSearchQuery, filtered, fetchUsers }
}