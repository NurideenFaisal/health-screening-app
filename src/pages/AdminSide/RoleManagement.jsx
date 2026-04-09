import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Search, KeyRound, Trash2, Shield, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { SECTIONS, getSectionByValue } from '../../config/sections'
import {
  Button, Toast, CredentialsModal, AddUserModal, EditUserModal,
  ResetPasswordModal, DeleteUserModal
} from '../../components/RoleManagement/RoleManagementModals'

// ─── Local Storage Keys ──────────────────────────────────────────────────────
const STORAGE_KEY = 'roleManagement_users'
const STORAGE_TIMESTAMP = 'roleManagement_timestamp'

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RoleManagement() {
  const { profile } = useAuthStore()
  const isSuperAdmin = profile?.role === 'super-admin'
  const isClinicAdmin = profile?.role === 'admin' && profile?.clinic_id

  // Core state
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '1' })
  const [errors, setErrors] = useState({})

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ role: '', section: '' })
  const [editErrors, setEditErrors] = useState({})

  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)

  const [toast, setToast] = useState(null)
  const [credentials, setCredentials] = useState(null)

  // ─── Local Storage Helpers ─────────────────────────────────────────────────
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

  // ─── Real-time Subscription Setup ──────────────────────────────────────────
  useEffect(() => {
    // Load cached data immediately
    const cachedUsers = loadFromCache()
    if (cachedUsers.length > 0) {
      setUsers(cachedUsers)
      setLoading(false)
    }

    // Set up real-time subscription
    const setupSubscription = () => {
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

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupSubscription()

    // Fetch fresh data in background
    fetchUsers()

    return cleanup
  }, [])

  // ─── Fetch Users ──────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, role, section, clinic_id')
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
        showToast('Failed to load users', 'error')
      } else {
        setUsers(data || [])
        saveToCache(data || [])
      }
    } catch (err) {
      showToast('Network error loading users', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Toast Helper ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type })

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = u => {
    const errs = {}
    if (!u.firstName) errs.firstName = 'Required'
    if (!u.lastName) errs.lastName = 'Required'
    if (!u.email) errs.email = 'Required'
    if (!u.password) errs.password = 'Required'
    if (u.role === 'Clinician' && !u.assignedSection) errs.assignedSection = 'Required'
    return errs
  }

  // ─── Add User ─────────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    const errs = validate(newUser)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        showToast('You must be logged in as admin', 'error')
        setSaving(false)
        return
      }

      const res = await fetch('https://klxhsbawtdcftfqirtcw.supabase.co/functions/v1/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role.toLowerCase(),
          assignedSection: newUser.role.toLowerCase() === 'clinician' ? newUser.assignedSection : null,
          clinic_id: isClinicAdmin ? profile?.clinic_id : null,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Failed to create user', 'error')
      } else {
        setCredentials({
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          password: newUser.password,
        })
        setShowAddModal(false)
        setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '1' })
        // No manual fetchUsers() - subscription will handle the update
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  // ─── Edit User ────────────────────────────────────────────────────────────
  const openEditModal = (user) => {
    if (user.role === 'super-admin') {
      showToast('System accounts are protected', 'error')
      return
    }
    setEditingUser(user)
    setEditForm({
      role: user.role || 'clinician',
      section: user.section || '1',
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (editingUser?.role === 'super-admin') {
      showToast('System accounts are protected', 'error')
      setShowEditModal(false)
      return
    }

    if (editForm.role === 'clinician' && !editForm.section) {
      setEditErrors({ section: 'Required for clinicians' })
      return
    }
    setEditErrors({})
    setSaving(true)

    const updates = {
      role: editForm.role,
      section: editForm.role === 'clinician' ? editForm.section : null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', editingUser.id)

    if (error) {
      showToast('Failed to update user: ' + error.message, 'error')
    } else {
      showToast(`${editingUser.full_name} updated successfully`)
      setShowEditModal(false)
      setEditingUser(null)
      // No manual fetchUsers() - subscription will handle the update
    }
    setSaving(false)
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  const openResetModal = (user) => {
    setResetUser(user)
    setNewPassword('')
    setResetError('')
    setShowResetModal(true)
  }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters')
      return
    }
    setResetError('')
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('https://klxhsbawtdcftfqirtcw.supabase.co/functions/v1/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: resetUser.id, newPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to reset password', 'error')
      } else {
        showToast(`Password reset for ${resetUser.full_name}`)
        setShowResetModal(false)
        setResetUser(null)
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  // ─── Delete User ──────────────────────────────────────────────────────────
  const openDeleteModal = (user) => {
    if (user.role === 'super-admin') {
      showToast('System accounts are protected', 'error')
      return
    }
    setDeletingUser(user)
    setShowDeleteModal(true)
  }

  const handleDeleteUser = async () => {
    if (deletingUser?.role === 'super-admin') {
      showToast('System accounts are protected', 'error')
      setShowDeleteModal(false)
      return
    }

    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      let deleted = false
      if (session) {
        try {
          const res = await fetch('https://klxhsbawtdcftfqirtcw.supabase.co/functions/v1/delete-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ userId: deletingUser.id })
          })
          if (res.ok) deleted = true
        } catch (_) {
          // Edge function not found — fallback below
        }
      }

      if (!deleted) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', deletingUser.id)

        if (error) {
          showToast('Failed to delete user: ' + error.message, 'error')
          setSaving(false)
          return
        }
      }

      showToast(`${deletingUser.full_name} removed`)
      setShowDeleteModal(false)
      setDeletingUser(null)
      // No manual fetchUsers() - subscription will handle the update
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getInitial = name => name?.charAt(0).toUpperCase() || '?'
  const getRoleColor = role => role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'

  // ─── Filtered Users ───────────────────────────────────────────────────────
  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CredentialsModal show={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Role Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none w-48"
            />
          </div>
          <Button className="bg-emerald-600 text-white" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add User
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No users found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-600">Name</th>
                <th className="text-left p-3 font-semibold text-slate-600">Role</th>
                <th className="text-left p-3 font-semibold text-slate-600">Section</th>
                <th className="text-right p-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${getRoleColor(u.role)} flex items-center justify-center font-semibold text-xs`}>
                        {getInitial(u.full_name)}
                      </div>
                      <span className="font-medium text-slate-800">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize
                      ${u.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600">
                    {u.role === 'admin' ? (
                      <span className="text-slate-400 italic text-xs">Full Access</span>
                    ) : u.section ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium
                        ${getSectionByValue(u.section)?.doneColor || 'bg-slate-100'} text-white`}>
                        Section {u.section}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit role/section"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => openResetModal(u)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(u)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remove user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        errors={errors}
        setErrors={setErrors}
        onAddUser={handleAddUser}
        saving={saving}
      />

      <EditUserModal
        show={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingUser(null) }}
        editingUser={editingUser}
        editForm={editForm}
        setEditForm={setEditForm}
        editErrors={editErrors}
        onSaveEdit={handleSaveEdit}
        saving={saving}
      />

      <ResetPasswordModal
        show={showResetModal}
        onClose={() => { setShowResetModal(false); setResetUser(null) }}
        resetUser={resetUser}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        resetError={resetError}
        setResetError={setResetError}
        onResetPassword={handleResetPassword}
        saving={saving}
      />

      <DeleteUserModal
        show={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingUser(null) }}
        deletingUser={deletingUser}
        onDeleteUser={handleDeleteUser}
        saving={saving}
      />
    </div>
  )
}