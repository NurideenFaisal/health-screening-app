import { useEffect, useState } from 'react'
import { AlertCircle, Check, CheckCircle2, Copy, Eye, KeyRound, Shield, User, X } from 'lucide-react'
import { Button as BaseButton, IconButton, TextInput } from '../ui/primitives'

function MultiSectionPicker({ selected = [], onChange, sectionOptions = [], error, templateAssignments = {} }) {
  const toggle = (value, isActivated) => {
    if (!isActivated) return
    onChange(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value])
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</label>
      <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 p-2">
        {sectionOptions.map(section => {
          const checked = selected.includes(section.value)
          const isActivated = !!templateAssignments[section.value]
          return (
            <label
              key={section.value}
              className={`flex min-h-11 items-center gap-2 rounded-xl p-2 text-sm transition ${!isActivated ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${checked && isActivated ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(section.value, isActivated)} disabled={!isActivated} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30" />
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: section.color || '#059669' }} />
              <span className="min-w-0 flex-1 truncate text-slate-700">{section.label}</span>
              {!isActivated && <span className="text-[11px] font-medium text-rose-600">not activated</span>}
            </label>
          )
        })}
      </div>
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      {selected.length > 0 && <p className="mt-1 text-xs text-slate-400">{selected.length} section{selected.length > 1 ? 's' : ''} selected</p>}
    </div>
  )
}

export const Button = ({ children, className = '', variant = 'secondary', ...props }) => (
  <BaseButton variant={variant} className={className} {...props}>{children}</BaseButton>
)

export const Modal = ({ show, onClose, title, children, actions }) => {
  useEffect(() => {
    if (!show) return undefined
    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl transition sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
          <IconButton label="Close modal" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="mt-5 space-y-4">{children}</div>
        {actions && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">{actions}</div>}
      </div>
    </div>
  )
}

export const Input = ({ children, ...props }) => <TextInput {...props}>{children}</TextInput>

export const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-6 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg sm:right-6 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
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
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">User Created</h2>
            <p className="text-xs text-slate-500">Share these credentials now. The password will not be shown again.</p>
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div><p className="mb-0.5 text-xs font-medium text-slate-400">Name</p><p className="text-sm font-semibold text-slate-800">{credentials.name}</p></div>
          <div><p className="mb-0.5 text-xs font-medium text-slate-400">Email</p><p className="text-sm font-mono text-slate-800">{credentials.email}</p></div>
          <div><p className="mb-0.5 text-xs font-medium text-slate-400">Password</p><p className="text-sm font-mono text-slate-800">{credentials.password}</p></div>
        </div>
        <div className="flex gap-2">
          <BaseButton variant={copied ? 'primary' : 'secondary'} className="flex-1" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}
          </BaseButton>
          <BaseButton variant="primary" className="flex-1" onClick={onClose}>Done</BaseButton>
        </div>
      </div>
    </div>
  )
}

export const AddUserModal = ({
  show, onClose, newUser, setNewUser, errors, setErrors, onAddUser, saving, sectionOptions = [], templateAssignments = {},
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Modal
      show={show}
      onClose={() => { onClose(); setErrors({}) }}
      title="Add User"
      actions={[
        <Button key="cancel" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>,
        <Button key="add" variant="primary" className="flex-1" onClick={onAddUser} disabled={saving}>{saving ? 'Creating...' : 'Add User'}</Button>,
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="First Name" value={newUser.firstName} onChange={event => setNewUser({ ...newUser, firstName: event.target.value })} error={errors.firstName} />
        <Input label="Last Name" value={newUser.lastName} onChange={event => setNewUser({ ...newUser, lastName: event.target.value })} error={errors.lastName} />
      </div>
      <Input label="Email" value={newUser.email} onChange={event => setNewUser({ ...newUser, email: event.target.value })} error={errors.email} />
      <Input label="Password" type={showPassword ? 'text' : 'password'} value={newUser.password} onChange={event => setNewUser({ ...newUser, password: event.target.value })} error={errors.password}>
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <Eye size={16} />
        </button>
      </Input>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Role</label>
        <select value={newUser.role} onChange={event => setNewUser({ ...newUser, role: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20">
          <option value="Admin">Admin</option>
          <option value="Clinician">Clinician</option>
        </select>
      </div>
      {newUser.role === 'Clinician' && (
        <MultiSectionPicker selected={newUser.assignedSections || []} onChange={values => setNewUser({ ...newUser, assignedSections: values })} sectionOptions={sectionOptions} error={errors.assignedSections} templateAssignments={templateAssignments} />
      )}
    </Modal>
  )
}

export const EditUserModal = ({
  show, onClose, editingUser, editForm, setEditForm, editErrors, onSaveEdit, saving, sectionOptions = [], templateAssignments = {},
}) => (
  <Modal
    show={show}
    onClose={onClose}
    title={`Edit - ${editingUser?.full_name || 'User'}`}
    actions={[
      <Button key="cancel" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>,
      <Button key="save" variant="primary" className="flex-1" onClick={onSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>,
    ]}
  >
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Role</label>
      <div className="grid grid-cols-2 gap-2">
        {['admin', 'clinician'].map(role => (
          <button
            key={role}
            type="button"
            onClick={() => setEditForm(form => ({ ...form, role }))}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize transition active:scale-[0.97] ${editForm.role === role ? role === 'admin' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-sky-600 bg-sky-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {role === 'admin' ? <Shield size={14} /> : <User size={14} />}
            {role}
          </button>
        ))}
      </div>
    </div>
    {editForm.role === 'clinician' && (
      <MultiSectionPicker selected={editForm.sections || []} onChange={values => setEditForm(form => ({ ...form, sections: values }))} sectionOptions={sectionOptions} error={editErrors.sections} templateAssignments={templateAssignments} />
    )}
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
      <span className="font-medium text-slate-700">{editingUser?.full_name}</span> will be set to <span className="font-semibold text-emerald-600">{editForm.role}</span>
      {editForm.role === 'clinician' && editForm.sections?.length > 0 && <> · {editForm.sections.length} section{editForm.sections.length > 1 ? 's' : ''}</>}
    </div>
  </Modal>
)

export const ResetPasswordModal = ({
  show, onClose, resetUser, newPassword, setNewPassword, resetError, setResetError, onResetPassword, saving,
}) => (
  <Modal
    show={show}
    onClose={onClose}
    title={`Reset Password - ${resetUser?.full_name || 'User'}`}
    actions={[
      <Button key="cancel" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>,
      <Button key="reset" variant="warning" className="flex-1" onClick={onResetPassword} disabled={saving}>{saving ? 'Resetting...' : 'Reset Password'}</Button>,
    ]}
  >
    <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3">
      <KeyRound size={16} className="mt-0.5 shrink-0 text-amber-500" />
      <p className="text-xs text-slate-600">This immediately changes <span className="font-semibold">{resetUser?.full_name}</span>'s password.</p>
    </div>
    <Input label="New Password" type="password" value={newPassword} onChange={event => { setNewPassword(event.target.value); setResetError('') }} error={resetError} placeholder="Min. 6 characters" />
  </Modal>
)

export const DeleteUserModal = ({ show, onClose, deletingUser, onDeleteUser, saving }) => {
  const isDisabled = deletingUser?.is_active === false
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={isDisabled ? 'Activate User' : 'Deactivate User'}
      actions={[
        <Button key="cancel" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>,
        <Button key="confirm" variant={isDisabled ? 'primary' : 'warning'} className="flex-1" onClick={onDeleteUser} disabled={saving}>{saving ? 'Please wait...' : isDisabled ? 'Activate' : 'Deactivate'}</Button>,
      ]}
    >
      <div className={`flex items-start gap-3 rounded-xl border p-4 ${isDisabled ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
        <AlertCircle size={18} className={isDisabled ? 'mt-0.5 shrink-0 text-emerald-500' : 'mt-0.5 shrink-0 text-amber-500'} />
        <div>
          <p className="text-sm font-medium text-slate-800">{isDisabled ? 'Activate' : 'Deactivate'} <span className={isDisabled ? 'text-emerald-600' : 'text-amber-600'}>{deletingUser?.full_name}</span>?</p>
          <p className="mt-1 text-xs text-slate-500">{isDisabled ? 'They will be able to log in again.' : 'They will no longer be able to log in. Their data is preserved.'}</p>
        </div>
      </div>
    </Modal>
  )
}
