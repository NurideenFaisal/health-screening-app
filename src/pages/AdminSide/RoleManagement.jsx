import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useActiveCycleQuery } from '../../hooks/useActiveCycleQuery'
import { useSectionDefinitions } from '../../hooks/useSectionDefinitions'
import { useUsersManagement, getInitial, getRoleColor, getSectionOption } from '../../hooks/useUsersManagement'
import { useTemplateActivation } from '../../hooks/useTemplateActivation'
import { Button, Toast, CredentialsModal, AddUserModal, EditUserModal, ResetPasswordModal, DeleteUserModal } from '../../components/RoleManagement/RoleManagementModals'
import UsersTable from '../../components/RoleManagement/UsersTable'
import TemplateActivationPanel from '../../components/RoleManagement/TemplateActivationPanel'

export default function RoleManagement() {
  const { profile } = useAuthStore()
  const isClinicAdmin = profile?.role === 'admin' && profile?.clinic_id
  const navigate = useNavigate()
  const activeCycleQuery = useActiveCycleQuery()
  const activeCycle = activeCycleQuery.data ?? null

  const { sections: allSectionDefinitions } = useSectionDefinitions([])
  const sectionOptions = allSectionDefinitions.map(section => ({ value: String(section.section_number), label: section.name || `Section ${section.section_number}`, shortLabel: section.short_name || `S${section.section_number}`, color: section.color }))

  const { users, loading, searchQuery, setSearchQuery, filtered, fetchUsers } = useUsersManagement()
  const { publishedTemplates, templateAssignments, templateSelections, setTemplateSelections, loadingTemplatePanel, activatingSection, handleActivateTemplate } = useTemplateActivation([], activeCycle, profile)

  const [showAddModal, setShowAddModal] = useState(false)
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '' })
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
  const [saving, setSaving] = useState(false)

  const showToast = (message, type = 'success') => setToast({ message, type })

  const validate = u => {
    const errs = {}
    if (!u.firstName) errs.firstName = 'Required'
    if (!u.lastName) errs.lastName = 'Required'
    if (!u.email) errs.email = 'Required'
    if (!u.password) { errs.password = 'Required' } else if (u.password.length < 6) { errs.password = 'Must be at least 6 characters' }
    if (u.role !== 'Admin' && !u.assignedSection) errs.assignedSection = 'Required'
    return errs
  }

  const handleAddUser = async () => {
    const errs = validate(newUser); setErrors(errs)
    if (Object.keys(errs).length) { console.log('Validation failed:', errs); return }
    setSaving(true)
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) { showToast('You must be logged in as admin', 'error'); setSaving(false); return }
      const body = { firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, password: newUser.password, role: newUser.role.toLowerCase(), assignedSection: newUser.role.toLowerCase() === 'clinician' ? newUser.assignedSection : null, section_number: newUser.role.toLowerCase() === 'clinician' ? Number.parseInt(newUser.assignedSection, 10) : null, clinic_id: isClinicAdmin ? profile?.clinic_id : null }
      console.log('Sending to edge function:', body)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify(body) })
      const data = await res.json()
      console.log('Edge function response:', data)
      if (!res.ok) { showToast(data.error || 'Failed to create user', 'error') } else { setCredentials({ name: `${newUser.firstName} ${newUser.lastName}`, email: newUser.email, password: newUser.password }); setShowAddModal(false); setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: sectionOptions[0]?.value || '' }) }
    } catch (err) { showToast('Network error: ' + err.message, 'error') }
    setSaving(false)
  }

  const openEditModal = (user) => {
    if (user.role === 'super-admin') { showToast('System accounts are protected', 'error'); return }
    const sections = Array.isArray(user.assigned_sections) ? user.assigned_sections : []
    setEditingUser(user); setEditForm({ role: user.role || 'clinician', section: sections[0] || sectionOptions[0]?.value || '' }); setEditErrors({}); setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (editingUser?.role === 'super-admin') { showToast('System accounts are protected', 'error'); setShowEditModal(false); return }
    if (editForm.role === 'clinician' && !editForm.section) { setEditErrors({ section: 'Required for clinicians' }); return }
    setEditErrors({}); setSaving(true)
    const updates = { role: editForm.role, assigned_sections: editForm.role === 'clinician' ? [editForm.section] : null }
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

  const handleDeleteUser = async () => {
    if (deletingUser?.role === 'super-admin') { showToast('System accounts are protected', 'error'); setShowDeleteModal(false); return }
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      let deleted = false
      if (session) { try { const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({ userId: deletingUser.id }) }); if (res.ok) deleted = true } catch (_) { } }
      if (!deleted) { const { error } = await supabase.from('profiles').delete().eq('id', deletingUser.id); if (error) { showToast('Failed to delete user: ' + error.message, 'error'); setSaving(false); return } }
      showToast(`${deletingUser.full_name} removed`); setShowDeleteModal(false); setDeletingUser(null)
    } catch (err) { showToast('Error: ' + err.message, 'error') }
    setSaving(false)
  }

  return (
    <div className="w-full p-6 space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <CredentialsModal show={!!credentials} credentials={credentials} onClose={() => setCredentials(null)} />
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Role Management</h2>
        <div className="flex gap-2">
          <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none w-48" /></div>
          <Button className="bg-emerald-600 text-white" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add User</Button>
        </div>
      </div>
      {isClinicAdmin && <TemplateActivationPanel activeCycle={activeCycle} activeCycleQuery={activeCycleQuery} publishedTemplates={publishedTemplates} templateAssignments={templateAssignments} templateSelections={templateSelections} setTemplateSelections={setTemplateSelections} activatingSection={activatingSection} handleActivateTemplate={handleActivateTemplate} sectionOptions={sectionOptions} navigate={navigate} />}
      <UsersTable users={users} loading={loading} filtered={filtered} onEdit={openEditModal} onReset={openResetModal} onDelete={openDeleteModal} sectionOptions={sectionOptions} />
      <AddUserModal show={showAddModal} onClose={() => setShowAddModal(false)} newUser={newUser} setNewUser={setNewUser} errors={errors} setErrors={setErrors} onAddUser={handleAddUser} saving={saving} clinicId={profile?.clinic_id} cycleId={activeCycle?.id} sectionOptions={sectionOptions} />
      <EditUserModal show={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null) }} editingUser={editingUser} editForm={editForm} setEditForm={setEditForm} editErrors={editErrors} onSaveEdit={handleSaveEdit} saving={saving} sectionOptions={sectionOptions} clinicId={profile?.clinic_id} cycleId={activeCycle?.id} />
      <ResetPasswordModal show={showResetModal} onClose={() => { setShowResetModal(false); setResetUser(null) }} resetUser={resetUser} newPassword={newPassword} setNewPassword={setNewPassword} resetError={resetError} setResetError={setResetError} onResetPassword={handleResetPassword} saving={saving} />
      <DeleteUserModal show={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletingUser(null) }} deletingUser={deletingUser} onDeleteUser={handleDeleteUser} saving={saving} />
    </div>
  )
}