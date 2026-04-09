import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Search, X, AlertCircle, CheckCircle2, Copy, Check, Trash2, Shield, User, KeyRound } from 'lucide-react'
import { SECTIONS, getSectionByValue } from '../../config/sections'

// ─── Reusable Components ──────────────────────────────────────────────────────
export const Button = ({ children, className = '', ...props }) => (
  <button className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${className}`} {...props}>
    {children}
  </button>
)

export const Modal = ({ show, onClose, title, children, actions }) => {
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

export const Input = ({ label, error, type = 'text', children, ...props }) => (
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

export const Toast = ({ message, type, onClose }) => {
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

export const CredentialsModal = ({ show, onClose, credentials }) => {
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

// ─── Add User Modal ──────────────────────────────────────────────────────────
export const AddUserModal = ({
  show, onClose, newUser, setNewUser, errors, setErrors, onAddUser, saving
}) => (
  <Modal
    show={show}
    onClose={() => { onClose(); setErrors({}) }}
    title="Add User"
    actions={[
      <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={onClose}>Cancel</Button>,
      <Button key="a" className="bg-emerald-600 text-white flex-1" onClick={onAddUser} disabled={saving}>
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
)

// ─── Edit Role/Section Modal ─────────────────────────────────────────────────
export const EditUserModal = ({
  show, onClose, editingUser, editForm, setEditForm, editErrors, onSaveEdit, saving
}) => (
  <Modal
    show={show}
    onClose={() => { onClose(); }}
    title={`Edit — ${editingUser?.full_name}`}
    actions={[
      <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={onClose}>Cancel</Button>,
      <Button key="s" className="bg-emerald-600 text-white flex-1" onClick={onSaveEdit} disabled={saving}>
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
          {SECTIONS.map(s => {
            const isSelected = editForm.section === s.value
            return (
              <button
                key={s.value}
                onClick={() => setEditForm(f => ({ ...f, section: s.value }))}
                className={`py-2 rounded-lg border text-sm font-medium transition
                  ${isSelected ? `${s.doneColor} text-white border-transparent` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                {s.label}
              </button>
            )
          })}
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
)

// ─── Reset Password Modal ────────────────────────────────────────────────────
export const ResetPasswordModal = ({
  show, onClose, resetUser, newPassword, setNewPassword, resetError, setResetError, onResetPassword, saving
}) => (
  <Modal
    show={show}
    onClose={() => { onClose(); }}
    title={`Reset Password — ${resetUser?.full_name}`}
    actions={[
      <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={onClose}>Cancel</Button>,
      <Button key="r" className="bg-amber-500 text-white flex-1" onClick={onResetPassword} disabled={saving}>
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
)

// ─── Delete Confirm Modal ────────────────────────────────────────────────────
export const DeleteUserModal = ({
  show, onClose, deletingUser, onDeleteUser, saving
}) => (
  <Modal
    show={show}
    onClose={() => { onClose(); }}
    title="Remove User"
    actions={[
      <Button key="c" className="bg-slate-100 text-slate-700 flex-1" onClick={onClose}>Cancel</Button>,
      <Button key="d" className="bg-red-500 text-white flex-1" onClick={onDeleteUser} disabled={saving}>
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
)