import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Search, X, AlertCircle, CheckCircle2, Copy, Check, Trash2, Shield, User, KeyRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Reusable Components ──────────────────────────────────────────────────────
const Button = ({ children, className = '', ...props }) => (
  <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${className}`} {...props}>
    {children}
  </button>
)

const Modal = ({ show, onClose, title, children, actions }) => {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {actions && <div className="flex gap-2 pt-2">{actions}</div>}
      </div>
    </div>
  )
}

const Input = ({ label, error, type = 'text', children, ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <div className="relative">
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
        {...props}
      />
      {children}
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  )
}

const CredentialsModal = ({ show, onClose, credentials }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(`Email: ${credentials?.email}\nPassword: ${credentials?.password}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  if (!show || !credentials) return null
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">User Created!</h2>
            <p className="text-xs text-slate-500">Share these credentials now — password won't be shown again.</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div><p className="text-xs text-slate-400 font-medium mb-0.5">Name</p><p className="text-sm font-semibold text-slate-800">{credentials.name}</p></div>
          <div><p className="text-xs text-slate-400 font-medium mb-0.5">Email</p><p className="text-sm font-mono text-slate-800">{credentials.email}</p></div>
          <div><p className="text-xs text-slate-400 font-medium mb-0.5">Password</p><p className="text-sm font-mono text-slate-800">{credentials.password}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white">Done</button>
        </div>
      </div>
    </div>
  )
}

// ─── Sections & Colors ──────────────────────────────────────────────────────
const SECTIONS = [
  { value: '1', label: 'Section 1', color: 'bg-emerald-400 text-white' },
  { value: '2', label: 'Section 2', color: 'bg-blue-400 text-white' },
  { value: '3', label: 'Section 3', color: 'bg-purple-400 text-white' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RoleManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '1' })
  const [errors, setErrors] = useState({})

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)   // { id, full_name, role, section }
  const [editForm, setEditForm] = useState({ role: '', section: '' })
  const [editErrors, setEditErrors] = useState({})

  // Delete confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)

  // Reset password
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')

  const [toast, setToast] = useState(null)
  const [credentials, setCredentials] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })
  const getInitial = name => name?.charAt(0).toUpperCase() || '?'
  const getRoleColor = role => role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'

  const validate = u => {
    const errs = {}
    if (!u.firstName) errs.firstName = 'Required'
    if (!u.lastName) errs.lastName = 'Required'
    if (!u.email) errs.email = 'Required'
    if (!u.password) errs.password = 'Required'
    if (u.role === 'Clinician' && !u.assignedSection) errs.assignedSection = 'Required'
    return errs
  }

  // ─── Fetch Users ───────────────────────────────────────────────
  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, section')
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Failed to load users', 'error')
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  // ─── Add User (Calls Edge Function) ─────────────────────────────
  async function handleAddUser() {
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
        fetchUsers()
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  // ─── Open Edit Modal ─────────────────────────────────────────────
  function openEditModal(user) {
    setEditingUser(user)
    setEditForm({
      role: user.role || 'clinician',
      section: user.section || '1',
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  // ─── Save Role/Section Edit ──────────────────────────────────────
  async function handleSaveEdit() {
    // Validate: clinicians must have a section
    if (editForm.role === 'clinician' && !editForm.section) {
      setEditErrors({ section: 'Required for clinicians' })
      return
    }
    setEditErrors({})
    setSaving(true)

    const updates = {
      role: editForm.role,
      // Clear section for admins, set it for clinicians
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
      fetchUsers()
    }
    setSaving(false)
  }

  // ─── Open Reset Modal ────────────────────────────────────────────
  function openResetModal(user) {
    setResetUser(user)
    setNewPassword('')
    setResetError('')
    setShowResetModal(true)
  }

  // ─── Reset Password ──────────────────────────────────────────────
  async function handleResetPassword() {
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

  // ─── Open Delete Confirm ─────────────────────────────────────────
  function openDeleteModal(user) {
    setDeletingUser(user)
    setShowDeleteModal(true)
  }

  // ─── Delete User (via Edge Function) ────────────────────────────
  // Deleting auth users requires service role key, so we call the same
  // edge function pattern. If you don't have a delete-user function yet,
  // we fall back to just removing the profile row.
  async function handleDeleteUser() {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Try edge function first (if you have one)
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

      // Fallback: just delete the profile row
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
      fetchUsers()
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    }
    setSaving(false)
  }

  // ─── Filtered Users ─────────────────────────────────────────────
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
        {loading ? (
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
                        ${SECTIONS.find(s => s.value === u.section)?.color || 'bg-slate-100 text-slate-600'}`}>
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

      {/* ── Add User Modal ── */}
      <Modal
        show={showAddModal}
        onClose={() => { setShowAddModal(false); setErrors({}) }}
        title="Add User"
        actions={[
          <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>,
          <Button key="a" className="bg-emerald-600 text-white flex-1" onClick={handleAddUser} disabled={saving}>
            {saving ? 'Creating...' : 'Add User'}
          </Button>
        ]}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} error={errors.firstName} />
          <Input label="Last Name" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} error={errors.lastName} />
        </div>
        <Input label="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} error={errors.email} />
        <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} error={errors.password} />
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="Admin">Admin</option>
              <option value="Clinician">Clinician</option>
            </select>
          </div>
          {newUser.role === 'Clinician' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
              <select value={newUser.assignedSection} onChange={e => setNewUser({ ...newUser, assignedSection: e.target.value })} className="w-full border border-slate-200 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Edit Role/Section Modal ── */}
      <Modal
        show={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingUser(null) }}
        title={`Edit — ${editingUser?.full_name}`}
        actions={[
          <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={() => setShowEditModal(false)}>Cancel</Button>,
          <Button key="s" className="bg-emerald-600 text-white flex-1" onClick={handleSaveEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        ]}
      >
        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
          <div className="grid grid-cols-2 gap-2">
            {['admin', 'clinician'].map(r => (
              <button
                key={r}
                onClick={() => setEditForm(f => ({ ...f, role: r }))}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition capitalize
                  ${editForm.role === r
                    ? r === 'admin'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
              >
                {r === 'admin' ? <Shield size={14} /> : <User size={14} />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Section selector — only for clinicians */}
        {editForm.role === 'clinician' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
            <div className="grid grid-cols-3 gap-2">
              {SECTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setEditForm(f => ({ ...f, section: s.value }))}
                  className={`py-2 rounded-lg border text-sm font-medium transition
                    ${editForm.section === s.value
                      ? `${s.color} border-transparent`
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {editErrors.section && <p className="text-xs text-red-500 mt-1">{editErrors.section}</p>}
          </div>
        )}

        {/* Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{editingUser?.full_name}</span> will be set to{' '}
          <span className={`font-semibold ${editForm.role === 'admin' ? 'text-emerald-600' : 'text-blue-600'}`}>
            {editForm.role}
          </span>
          {editForm.role === 'clinician' && editForm.section && (
            <> · Section {editForm.section}</>
          )}
        </div>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal
        show={showResetModal}
        onClose={() => { setShowResetModal(false); setResetUser(null) }}
        title={`Reset Password — ${resetUser?.full_name}`}
        actions={[
          <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={() => setShowResetModal(false)}>Cancel</Button>,
          <Button key="r" className="bg-amber-500 text-white flex-1" onClick={handleResetPassword} disabled={saving}>
            {saving ? 'Resetting...' : 'Reset Password'}
          </Button>
        ]}
      >
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <KeyRound size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600">
            This will immediately change <span className="font-semibold">{resetUser?.full_name}</span>'s password. Make sure to share the new password with them.
          </p>
        </div>
        <Input
          label="New Password"
          type="password"
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setResetError('') }}
          error={resetError}
          placeholder="Min. 6 characters"
        />
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        show={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingUser(null) }}
        title="Remove User"
        actions={[
          <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>,
          <Button key="d" className="bg-red-500 text-white flex-1" onClick={handleDeleteUser} disabled={saving}>
            {saving ? 'Removing...' : 'Remove User'}
          </Button>
        ]}
      >
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-800">
              Remove <span className="text-red-600">{deletingUser?.full_name}</span>?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              This will delete their profile. Their auth account will also be removed if a delete-user Edge Function is configured.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}