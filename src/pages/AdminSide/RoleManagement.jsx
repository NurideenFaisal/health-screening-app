import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useActiveCycleQuery } from '../../hooks/useActiveCycleQuery'
import { useSectionDefinitions } from '../../hooks/useSectionDefinitions'
import { useUsersManagement } from '../../hooks/useUsersManagement'
import { useTemplateActivation } from '../../hooks/useTemplateActivation'
import { Button, Toast, CredentialsModal, AddUserModal, EditUserModal, ResetPasswordModal, DeleteUserModal } from '../../components/RoleManagement/RoleManagementModals'
import { Button as PrimitiveButton, SearchInput } from '../../components/ui/primitives'
import UsersTable from '../../components/RoleManagement/UsersTable'
import TemplateActivationPanel from '../../components/RoleManagement/TemplateActivationPanel'

export default function RoleManagement() {
  const { profile } = useAuthStore()
  const isClinicAdmin = profile?.role === 'admin' && profile?.clinic_id
  const navigate = useNavigate()
  const activeCycleQuery = useActiveCycleQuery()
  const activeCycle = activeCycleQuery.data ?? null

  const { sections: allSectionDefinitions } = useSectionDefinitions([])
  const { users, loading, searchQuery, setSearchQuery, filtered, fetchUsers } = useUsersManagement()
  const { publishedTemplates, templateAssignments, activatingSection, handleActivateTemplate } = useTemplateActivation([], activeCycle, profile)

  const sectionOptions = allSectionDefinitions.map(s => ({ value: String(s.section_number), label: s.name || `Section ${s.section_number}`, shortLabel: s.short_name || `S${s.section_number}`, color: s.color }))

  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSections: [] })
  const [errors, setErrors] = useState({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ role: '', sections: [] })
  const [editErrors, setEditErrors] = useState({})
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetUser, setResetUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)
  const [toast, setToast] = useState(null)
  const [credentials, setCredentials] = useState(null)
  const [saving, setSaving] = useState(false)

  const showToast = (message, type = 'success') => setToast({ message, type })

  const validate = u => {
    const errs = {}
    if (!u.firstName) errs.firstName = 'Required'
    if (!u.lastName) errs.lastName = 'Required'
    if (!u.email) errs.email = 'Required'
    if (!u.password) errs.password = 'Required'
    else if (u.password.length < 6) errs.password = 'Must be at least 6 characters'
    return errs
  }

  const handleAddUser = async () => {
    const errs = validate(newUser); setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) { showToast('You must be logged in as admin', 'error'); setSaving(false); return }
      const body = { firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, password: newUser.password, role: newUser.role.toLowerCase(), assignedSections: newUser.role === 'Admin' ? null : (newUser.assignedSections || []), clinic_id: isClinicAdmin ? profile?.clinic_id : null }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')
      showToast('User created successfully')
      setShowAddModal(false)
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSections: [] })
      fetchUsers()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const openEditModal = (user) => {
    if (user.role === 'super-admin') { showToast('System accounts are protected', 'error'); return }
    const sections = Array.isArray(user.assigned_sections) ? user.assigned_sections.map(String) : []
    setEditingUser(user); setEditForm({ role: user.role || 'clinician', sections }); setEditErrors({}); setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (editingUser?.role === 'super-admin') { showToast('System accounts are protected', 'error'); setShowEditModal(false); return }
    setEditErrors({}); setSaving(true)
    const updates = { role: editForm.role, assigned_sections: editForm.role === 'clinician' ? editForm.sections.map(Number) : null }
    const { error } = await supabase.from('profiles').update(updates).eq('id', editingUser.id)
    if (error) { showToast('Failed to update user: ' + error.message, 'error') } else { showToast(`${editingUser.full_name} updated successfully`); setShowEditModal(false); setEditingUser(null); fetchUsers() }
    setSaving(false)
  }

  const openResetModal = (user) => { setResetUser(user); setNewPassword(''); setResetError(''); setShowResetModal(true) }

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setResetError('Password must be at least 6 characters'); return }
    setResetError(''); setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ userId: resetUser.id, newPassword }) })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed to reset password', 'error') } else { showToast(`Password reset for ${resetUser.full_name}`); setShowResetModal(false); setResetUser(null) }
    } catch (err) { showToast('Network error: ' + err.message, 'error') }
    setSaving(false)
  }

  const openDeleteModal = (user) => { if (user.role === 'super-admin') { showToast('System accounts are protected', 'error'); return }; setDeletingUser(user); setShowDeleteModal(true) }

  const handleToggleActive = async () => {
    if (deletingUser?.role === 'super-admin') { showToast('System accounts are protected', 'error'); setShowDeleteModal(false); return }
    if (deletingUser?.id === profile?.id) { showToast('You cannot change your own status', 'error'); setShowDeleteModal(false); return }
    setSaving(true)
    try {
      const newStatus = deletingUser.is_active === false
      const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', deletingUser.id)
      if (error) throw error
      showToast(`${deletingUser.full_name} ${newStatus ? 'activated' : 'deactivated'}`)
      setShowDeleteModal(false); setDeletingUser(null); fetchUsers()
    } catch (err) { showToast('Error: ' + err.message, 'error') }
    setSaving(false)
  }

  return (
    <div className="w-full space-y-6 bg-slate-100 p-4 sm:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CredentialsModal show={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />
      <div className="mx-auto w-full max-w-[1400px] space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Role Management</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 sm:flex-none sm:w-52">
              <SearchInput
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search users..."
              />
            </div>
            <PrimitiveButton onClick={() => setShowAddModal(true)} variant="primary" className="min-h-10 px-3 py-2">
              <Plus size={15} /> Add User
            </PrimitiveButton>
          </div>
        </div>
        {isClinicAdmin && <TemplateActivationPanel activeCycle={activeCycle} activeCycleQuery={activeCycleQuery} publishedTemplates={publishedTemplates} templateAssignments={templateAssignments} activatingSection={activatingSection} handleActivateTemplate={handleActivateTemplate} sectionOptions={sectionOptions} navigate={navigate} />}
        <UsersTable users={users} loading={loading} filtered={filtered} onEdit={openEditModal} onReset={openResetModal} onDelete={openDeleteModal} sectionOptions={sectionOptions} />
      </div>
      <AddUserModal show={showAddModal} onClose={() => { setShowAddModal(false); setErrors({}) }} newUser={newUser} setNewUser={setNewUser} errors={errors} setErrors={setErrors} onAddUser={handleAddUser} saving={saving} clinicId={profile?.clinic_id} cycleId={activeCycle?.id} sectionOptions={sectionOptions} templateAssignments={templateAssignments} />
      <EditUserModal show={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null) }} editingUser={editingUser} editForm={editForm} setEditForm={setEditForm} editErrors={editErrors} onSaveEdit={handleSaveEdit} saving={saving} sectionOptions={sectionOptions} clinicId={profile?.clinic_id} cycleId={activeCycle?.id} templateAssignments={templateAssignments} />
      <ResetPasswordModal show={showResetModal} onClose={() => { setShowResetModal(false); setResetUser(null) }} resetUser={resetUser} newPassword={newPassword} setNewPassword={setNewPassword} resetError={resetError} setResetError={setResetError} onResetPassword={handleResetPassword} saving={saving} />
      <DeleteUserModal show={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletingUser(null) }} deletingUser={deletingUser} onDeleteUser={handleToggleActive} saving={saving} />
    </div>
  )
}
