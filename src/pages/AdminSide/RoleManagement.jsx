import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Plus, Edit2, Search, X, AlertCircle, CheckCircle2, Copy, KeyRound, Check } from 'lucide-react'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '1' })
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [credentials, setCredentials] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })
  const getInitial = name => name?.charAt(0).toUpperCase() || '?'
  const getRoleColor = role => role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
  const getSectionColor = section => SECTIONS.find(s => s.value === section)?.color || 'bg-slate-400 text-white'

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
    const { data, error } = await supabase.from('profiles').select('id, full_name, role, section').order('created_at', { ascending: false })
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

  // ─── Filtered Users ─────────────────────────────────────────────
  const filtered = users.filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="w-full p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CredentialsModal show={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Role Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none w-48" />
          </div>
          <Button className="bg-emerald-600 text-white" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add User</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        {loading ? <div className="text-center py-12 text-slate-400">Loading users...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold">Role</th>
                <th className="text-left p-3 font-semibold">Section</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${getRoleColor(u.role)} flex items-center justify-center font-semibold`}>{getInitial(u.full_name)}</div>
                      {u.full_name}
                    </div>
                  </td>
                  <td className="p-3 capitalize">{u.role}</td>
                  <td className="p-3">{u.role === 'admin' ? 'Full Access' : (u.section ? `Section ${u.section}` : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      <Modal show={showAddModal} onClose={() => setShowAddModal(false)} title="Add User" actions={[
        <Button key="c" className="bg-slate-100 flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>,
        <Button key="a" className="bg-emerald-600 text-white flex-1" onClick={handleAddUser} disabled={saving}>{saving ? '...' : 'Add'}</Button>
      ]}>
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} error={errors.firstName} />
          <Input label="Last Name" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} error={errors.lastName} />
        </div>
        <Input label="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} error={errors.email} />
        <Input label="Password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} error={errors.password} />
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full border p-2 rounded-lg text-sm">
              <option value="Admin">Admin</option>
              <option value="Clinician">Clinician</option>
            </select>
          </div>
          {newUser.role === 'Clinician' && (
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <select value={newUser.assignedSection} onChange={e => setNewUser({ ...newUser, assignedSection: e.target.value })} className="w-full border p-2 rounded-lg text-sm">
                {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
