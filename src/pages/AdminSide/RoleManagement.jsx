import React, { useState } from 'react'
import { Eye, EyeOff, Trash2, Plus, Edit2, Upload, Download, Search, SlidersHorizontal, X } from 'lucide-react'

// --- Reusable Components ---
const Button = ({ children, className = '', ...props }) => (
  <button
    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition ${className}`}
    {...props}
  >
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

const Input = ({ label, error, type='text', children, ...props }) => (
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

// --- Main Component ---
export default function RoleManagement() {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPasswordRows, setShowPasswordRows] = useState(new Set())
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const [users, setUsers] = useState([
    { id: 1, firstName: 'Kwame', lastName: 'Mensah', email: 'kwame@site.com', password: 'Admin123!', role: 'Admin', assignedSection: null },
    { id: 2, firstName: 'Ama', lastName: 'Asante', email: 'ama@site.com', password: 'Clinician1', role: 'Clinician', assignedSection: '1' },
    { id: 3, firstName: 'Kofi', lastName: 'Owusu', email: 'kofi@site.com', password: 'Clinician2', role: 'Clinician', assignedSection: '2' },
    { id: 4, firstName: 'Akua', lastName: 'Boateng', email: 'akua@site.com', password: 'Clinician3', role: 'Clinician', assignedSection: '3' },
  ])

  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '1' })
  const [errors, setErrors] = useState({})

  // --- Section Configuration ---
  const sections = [
    { value: '1', label: 'Section 1 (Vital/Immunize/Development)', color: 'bg-emerald-400 text-white' },
    { value: '2', label: 'Section 2 (Laboratory)', color: 'bg-blue-400 text-white' },
    { value: '3', label: 'Section 3 (Summary & Diagnosis)', color: 'bg-purple-400 text-white' },
  ]

  // --- Utilities ---
  const getInitial = firstName => firstName?.charAt(0).toUpperCase() || '?'
  const getRoleColor = role => role === 'Admin' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
  const getSectionColor = section => {
    const sectionConfig = sections.find(s => s.value === section)
    return sectionConfig ? sectionConfig.color : 'bg-slate-400 text-white'
  }
  const getSectionLabel = section => {
    const sectionConfig = sections.find(s => s.value === section)
    return sectionConfig ? `Section ${section}` : 'Unknown'
  }

  const toggleRow = id => {
    const newSelected = new Set(selectedRows)
    selectedRows.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedRows(newSelected)
  }
  const toggleAll = () => {
    setSelectedRows(selectedRows.size === filtered.length ? new Set() : new Set(filtered.map(u => u.id)))
  }
  const togglePassword = id => {
    const newSet = new Set(showPasswordRows)
    newSet.has(id) ? newSet.delete(id) : newSet.add(id)
    setShowPasswordRows(newSet)
  }

  const validateUser = user => {
    const errs = {}
    if (!user.firstName) errs.firstName = 'Required'
    if (!user.lastName) errs.lastName = 'Required'
    if (!user.email) errs.email = 'Required'
    if (!user.password) errs.password = 'Required'
    if (!['Admin', 'Clinician'].includes(user.role)) errs.role = 'Select role'
    // Clinicians MUST have an assigned section
    if (user.role === 'Clinician' && !user.assignedSection) {
      errs.assignedSection = 'Clinicians must be assigned to a section'
    }
    return errs
  }

  const handleAddUser = () => {
    const errs = validateUser(newUser)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const newId = Math.max(...users.map(u => u.id), 0) + 1
    // Clear assignedSection if Admin
    const userToAdd = {
      ...newUser,
      id: newId,
      assignedSection: newUser.role === 'Admin' ? null : newUser.assignedSection
    }
    setUsers([...users, userToAdd])
    setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'Clinician', assignedSection: '1' })
    setShowAddModal(false)
    setErrors({})
    setShowPasswordModal(false)
  }

  const handleSaveEdit = () => {
    const errs = validateUser(editingUser)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    // Clear assignedSection if Admin
    const userToSave = {
      ...editingUser,
      assignedSection: editingUser.role === 'Admin' ? null : editingUser.assignedSection
    }
    setUsers(users.map(u => u.id === userToSave.id ? userToSave : u))
    setEditingUser(null)
    setErrors({})
    setShowPasswordModal(false)
  }

  const deleteSelected = () => {
    setUsers(users.filter(u => !selectedRows.has(u.id)))
    setSelectedRows(new Set())
  }

  const filtered = users.filter(
    u => u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle role change in modals
  const handleRoleChange = (role, isEdit = false) => {
    if (isEdit) {
      setEditingUser({
        ...editingUser,
        role,
        assignedSection: role === 'Clinician' ? (editingUser.assignedSection || '1') : null
      })
    } else {
      setNewUser({
        ...newUser,
        role,
        assignedSection: role === 'Clinician' ? (newUser.assignedSection || '1') : null
      })
    }
  }

  // --- JSX ---
  return (
    <div className="w-full p-6 space-y-6">

      {/* Toolbar */}
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          <Button className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"><Upload size={16} /> Export</Button>
          <Button className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"><Download size={16} /> Import</Button>
          {selectedRows.size > 0 && (
            <Button className="bg-red-500 text-white hover:bg-red-600" onClick={deleteSelected}>
              <Trash2 size={16} /> Delete ({selectedRows.size})
            </Button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button className="bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"><SlidersHorizontal size={16} /> Sort</Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48"
            />
          </div>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => {setShowAddModal(true); setShowPasswordModal(false)}}><Plus size={16} /> Add</Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto max-h-[600px]">
        <table className="table-auto border-collapse w-full relative">
          <thead className="bg-slate-50 sticky top-0 z-30">
            <tr className="border-b border-slate-200">
              {[
                {key:'select',label:''},
                {key:'name',label:'Name',minW:200},
                {key:'email',label:'Email',minW:180},
                {key:'password',label:'Password',minW:120},
                {key:'role',label:'Role',minW:100},
                {key:'section',label:'Section',minW:180},
                {key:'actions',label:'Actions',stickyRight:true,minW:100}
              ].map(col=>(
                <th
                  key={col.key}
                  className={`text-left p-3 text-sm font-semibold text-slate-700 whitespace-nowrap ${col.stickyLeft?'sticky left-0 bg-slate-50 z-30':''} ${col.stickyRight?'sticky right-0 bg-slate-50 z-30 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]':''}`}
                  style={{minWidth:col.minW?`${col.minW}px`:'auto'}}
                >
                  {col.key==='select' ? (
                    <input type="checkbox" checked={selectedRows.size===filtered.length && filtered.length>0} onChange={toggleAll} className="w-4 h-4 rounded border-slate-300 text-emerald-600 cursor-pointer"/>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(user=>(
              <tr key={user.id} onClick={()=>toggleRow(user.id)} className={`border-b border-slate-100 text-sm transition-colors duration-150 cursor-pointer ${selectedRows.has(user.id)?'bg-emerald-50 hover:bg-emerald-100/70':'bg-white hover:bg-slate-50'}`}>
                <td className="p-3 sticky left-0 z-20 bg-inherit" onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={selectedRows.has(user.id)} onChange={()=>toggleRow(user.id)} className="w-4 h-4 rounded border-slate-300 text-emerald-600 cursor-pointer"/>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${getRoleColor(user.role)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                      {getInitial(user.firstName)}
                    </div>
                    <span>{user.firstName} {user.lastName}</span>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap font-mono text-slate-600">{user.email}</td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span>{showPasswordRows.has(user.id)?user.password:'••••••••'}</span>
                    <button onClick={e=>{e.stopPropagation(); togglePassword(user.id)}} className="text-slate-400 hover:text-slate-700">
                      {showPasswordRows.has(user.id)?<EyeOff size={16}/>:<Eye size={16}/>}
                    </button>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(user.role)}`}>{user.role}</span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  {user.role === 'Admin' ? (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">Full Access</span>
                  ) : (
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${getSectionColor(user.assignedSection)}`}>
                      {getSectionLabel(user.assignedSection)}
                    </span>
                  )}
                </td>
                <td className={`p-3 whitespace-nowrap sticky right-0 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] ${selectedRows.has(user.id)?'bg-emerald-50':'bg-white'}`} onClick={e=>e.stopPropagation()}>
                  <Button className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1.5" onClick={()=>{setEditingUser(user); setShowPasswordModal(false)}}><Edit2 size={16}/></Button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={7} className="text-center p-4 text-slate-500">No users found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <Modal
        show={showAddModal}
        onClose={()=>{setShowAddModal(false); setErrors({})}}
        title="Add New User"
        actions={[
          <Button key="cancel" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={()=>{setShowAddModal(false); setErrors({})}}>Cancel</Button>,
          <Button
            key="add"
            className={`flex-1 bg-emerald-600 text-white hover:bg-emerald-700 ${Object.keys(validateUser(newUser)).length>0?'opacity-50 cursor-not-allowed':''}`}
            onClick={handleAddUser}
            disabled={Object.keys(validateUser(newUser)).length>0}
          >
            Add User
          </Button>
        ]}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input label="First Name *" value={newUser.firstName} onChange={e=>setNewUser({...newUser, firstName:e.target.value})} error={errors.firstName}/>
          <Input label="Last Name *" value={newUser.lastName} onChange={e=>setNewUser({...newUser, lastName:e.target.value})} error={errors.lastName}/>
        </div>
        <Input label="Email *" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} error={errors.email}/>
        <Input label="Password *" type={showPasswordModal?'text':'password'} value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} error={errors.password}>
          <button type="button" onClick={()=>setShowPasswordModal(!showPasswordModal)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
            {showPasswordModal ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </Input>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
          <select value={newUser.role} onChange={e=>handleRoleChange(e.target.value, false)} className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 border-slate-200">
            <option value="Admin">Admin</option>
            <option value="Clinician">Clinician</option>
          </select>
          {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
        </div>
        {newUser.role === 'Clinician' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Section *</label>
            <select 
              value={newUser.assignedSection || '1'} 
              onChange={e=>setNewUser({...newUser, assignedSection:e.target.value})} 
              className={`w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.assignedSection ? 'border-red-500' : 'border-slate-200'}`}
            >
              {sections.map(section => (
                <option key={section.value} value={section.value}>{section.label}</option>
              ))}
            </select>
            {errors.assignedSection && <p className="text-xs text-red-500 mt-1">{errors.assignedSection}</p>}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={!!editingUser}
        onClose={()=>{setEditingUser(null); setErrors({})}}
        title="Edit User"
        actions={[
          <Button key="cancel" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={()=>{setEditingUser(null); setErrors({})}}>Cancel</Button>,
          <Button
            key="save"
            className={`flex-1 bg-emerald-600 text-white hover:bg-emerald-700 ${editingUser && Object.keys(validateUser(editingUser)).length>0?'opacity-50 cursor-not-allowed':''}`}
            onClick={handleSaveEdit}
            disabled={editingUser && Object.keys(validateUser(editingUser)).length>0}
          >
            Save Changes
          </Button>
        ]}
      >
        {editingUser && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" value={editingUser.firstName} onChange={e=>setEditingUser({...editingUser, firstName:e.target.value})} error={errors.firstName}/>
              <Input label="Last Name *" value={editingUser.lastName} onChange={e=>setEditingUser({...editingUser, lastName:e.target.value})} error={errors.lastName}/>
            </div>
            <Input label="Email *" value={editingUser.email} onChange={e=>setEditingUser({...editingUser, email:e.target.value})} error={errors.email}/>
            <Input label="Password *" type={showPasswordModal?'text':'password'} value={editingUser.password} onChange={e=>setEditingUser({...editingUser, password:e.target.value})} error={errors.password}>
              <button type="button" onClick={()=>setShowPasswordModal(!showPasswordModal)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                {showPasswordModal ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </Input>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role *</label>
              <select value={editingUser.role} onChange={e=>handleRoleChange(e.target.value, true)} className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 border-slate-200">
                <option value="Admin">Admin</option>
                <option value="Clinician">Clinician</option>
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
            </div>
            {editingUser.role === 'Clinician' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Section *</label>
                <select 
                  value={editingUser.assignedSection || '1'} 
                  onChange={e=>setEditingUser({...editingUser, assignedSection:e.target.value})} 
                  className={`w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${errors.assignedSection ? 'border-red-500' : 'border-slate-200'}`}
                >
                  {sections.map(section => (
                    <option key={section.value} value={section.value}>{section.label}</option>
                  ))}
                </select>
                {errors.assignedSection && <p className="text-xs text-red-500 mt-1">{errors.assignedSection}</p>}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  )
}