import React, { useState, useEffect } from 'react'
import { Upload, Download, Trash2, SlidersHorizontal, Search, Plus, Edit2, X, Clock } from 'lucide-react'

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

const Input = ({ label, error, ...props }) => (
  <div>
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm
        ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

// --- Main Component ---
export default function PeopleData() {
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPerson, setEditingPerson] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [people, setPeople] = useState([
    { id: 1, firstName: 'Kwame', lastName: 'Mensah', dob: '2017-02-15', childId: 'GH0001', sex: 'M', screenCount: 3 },
    { id: 2, firstName: 'Ama', lastName: 'Asante', dob: '2016-03-20', childId: 'GH0002', sex: 'F', screenCount: 5 },
    { id: 3, firstName: 'Kofi', lastName: 'Owusu', dob: '2019-06-05', childId: 'GH0003', sex: 'M', screenCount: 2 },
    { id: 4, firstName: 'Akua', lastName: 'Boateng', dob: '2013-10-10', childId: 'GH0004', sex: 'F', screenCount: 7 },
    { id: 5, firstName: 'Yaw', lastName: 'Osei', dob: '2012-12-17', childId: 'GH0005', sex: 'M', screenCount: 4 },
    { id: 6, firstName: 'Abena', lastName: 'Appiah', dob: '2012-07-23', childId: 'GH0006', sex: 'F', screenCount: 1 }
  ])

  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', dob: '', childId: 'GH', sex: '' })
  const [errors, setErrors] = useState({})

  // --- Utilities ---
  const calculateAge = dobString => {
    if (!dobString) return ''
    const birthDate = new Date(dobString)
    const today = new Date(2026, 1, 14)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const formatDOB = dobString => {
    if (!dobString) return ''
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const d = new Date(dobString)
    return `${d.getDate().toString().padStart(2,'0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }

  const getInitials = firstName => firstName?.charAt(0).toUpperCase() || '?'

  const filtered = people.filter(
    p => p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.childId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleRow = id => {
    const newSelected = new Set(selectedRows)
    selectedRows.has(id) ? newSelected.delete(id) : newSelected.add(id)
    setSelectedRows(newSelected)
  }

  const toggleAll = () => {
    setSelectedRows(selectedRows.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))
  }

  const validatePatient = patient => {
    const errs = {}
    if (!patient.firstName) errs.firstName = 'Required'
    if (!patient.lastName) errs.lastName = 'Required'
    if (!patient.childId) errs.childId = 'Required'
    if (!patient.dob) errs.dob = 'Required'
    else if (isNaN(new Date(patient.dob))) errs.dob = 'Invalid date'
    if (!['M', 'F'].includes(patient.sex)) errs.sex = 'Select gender'
    return errs
  }

  const handleAddPatient = () => {
    const errs = validatePatient(newPatient)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const newId = Math.max(...people.map(p => p.id), 0) + 1
    setPeople([...people, { ...newPatient, id: newId, screenCount: 0 }])
    setNewPatient({ firstName: '', lastName: '', dob: '', childId: 'GH', sex: '' })
    setShowAddModal(false)
    setErrors({})
  }

  const handleSaveEdit = () => {
    const errs = validatePatient(editingPerson)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setPeople(people.map(p => p.id === editingPerson.id ? editingPerson : p))
    setEditingPerson(null)
    setErrors({})
  }

  const deleteSelected = () => {
    setPeople(people.filter(p => !selectedRows.has(p.id)))
    setSelectedRows(new Set())
  }

  const getSexColor = sex => sex === 'M' ? 'bg-blue-300 text-white' : 'bg-pink-400 text-white'

  return (
    <div className="w-full p-6 space-y-6">

      {/* --- Top Toolbar --- */}
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
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add
          </Button>
        </div>
      </div>

      {/* --- Table --- */}
      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-x-auto max-h-[600px]">
        <table className="table-auto border-collapse w-full relative">
          <thead className="bg-slate-50 sticky top-0 z-30">
            <tr className="border-b border-slate-200">
              {[
                { key: 'select', label: '', stickyLeft: true },
                { key: 'name', label: 'Name', minW: 200 },
                { key: 'childId', label: 'Child ID', minW: 120 },
                { key: 'dob', label: 'DOB', minW: 130 },
                { key: 'age', label: 'Age', minW: 80 },
                { key: 'sex', label: 'Sex', minW: 80 },
                { key: 'screenCount', label: 'Screen No', minW: 120 },
                { key: 'actions', label: 'Actions', stickyRight: true, minW: 100 }
              ].map(col => (
                <th
                  key={col.key}
                  className={`text-left p-3 text-sm font-semibold text-slate-700 whitespace-nowrap ${col.stickyLeft ? 'sticky left-0 bg-slate-50 z-30' : ''} ${col.stickyRight ? 'sticky right-0 bg-slate-50 z-30 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                  style={{ minWidth: col.minW ? `${col.minW}px` : 'auto' }}
                >
                  {col.key === 'select' ? (
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 cursor-pointer"
                    />
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(person => (
              <tr
                key={person.id}
                onClick={() => toggleRow(person.id)}
                className={`border-b border-slate-100 text-sm transition-colors duration-150 cursor-pointer
                  ${selectedRows.has(person.id) ? 'bg-emerald-50 hover:bg-emerald-100/70' : 'bg-white hover:bg-slate-50'}`}
              >
                <td className="p-3 sticky left-0 z-20 bg-inherit" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(person.id)}
                    onChange={() => toggleRow(person.id)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 cursor-pointer"
                  />
                </td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${getSexColor(person.sex)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                      {getInitials(person.firstName)}
                    </div>
                    <span>{person.firstName} {person.lastName}</span>
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap font-mono text-slate-600">{person.childId}</td>
                <td className="p-3 whitespace-nowrap">{formatDOB(person.dob)}</td>
                <td className="p-3 whitespace-nowrap">{calculateAge(person.dob)}</td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getSexColor(person.sex)}`}>{person.sex}</span>
                </td>
                <td className="p-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition cursor-pointer">
                    <Clock size={14} />
                    <span className="font-semibold">{person.screenCount}</span>
                  </div>
                </td>
                <td className={`p-3 whitespace-nowrap sticky right-0 z-20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] ${selectedRows.has(person.id) ? 'bg-emerald-50' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                  <Button className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 p-1.5" onClick={() => setEditingPerson(person)}><Edit2 size={16} /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="text-center p-4 text-slate-500">No data found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* --- Add Modal --- */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Patient"
        actions={[
          <Button key="cancel" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setShowAddModal(false)}>Cancel</Button>,
          <Button
            key="add"
            className={`flex-1 bg-emerald-600 text-white hover:bg-emerald-700 ${Object.keys(validatePatient(newPatient)).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleAddPatient}
            disabled={Object.keys(validatePatient(newPatient)).length > 0}
          >
            Add Patient
          </Button>
        ]}
      >
        <Input
          label="Child ID *"
          required
          value={newPatient.childId}
          onChange={e => setNewPatient({ ...newPatient, childId: e.target.value })}
          error={errors.childId}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name *"
            required
            value={newPatient.firstName}
            onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })}
            error={errors.firstName}
          />
          <Input
            label="Last Name *"
            required
            value={newPatient.lastName}
            onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })}
            error={errors.lastName}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-slate-700 mb-1">Birthdate *</label>
          <input
            type="date"
            required
            value={newPatient.dob}
            onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })}
            className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
          />
          {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
          <div className="flex gap-4">
            {['M','F'].map(g => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  required
                  value={g}
                  checked={newPatient.sex === g}
                  onChange={e => setNewPatient({ ...newPatient, sex: e.target.value })}
                  className={`w-4 h-4 border-slate-300 focus:ring-2 ${g==='M' ? 'text-blue-600' : 'text-pink-600'}`}
                />
                <span className="text-sm">{g==='M' ? 'Male' : 'Female'}</span>
              </label>
            ))}
          </div>
          {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
        </div>
      </Modal>

      {/* --- Edit Modal --- */}
      <Modal
        show={!!editingPerson}
        onClose={() => setEditingPerson(null)}
        title="Edit Patient"
        actions={[
          <Button key="cancel" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => setEditingPerson(null)}>Cancel</Button>,
          <Button
            key="save"
            className={`flex-1 bg-emerald-600 text-white hover:bg-emerald-700 ${editingPerson && Object.keys(validatePatient(editingPerson)).length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleSaveEdit}
            disabled={editingPerson && Object.keys(validatePatient(editingPerson)).length > 0}
          >
            Save Changes
          </Button>
        ]}
      >
        {editingPerson && (
          <>
            <Input
              label="Child ID *"
              required
              value={editingPerson.childId}
              onChange={e => setEditingPerson({ ...editingPerson, childId: e.target.value })}
              error={errors.childId}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                required
                value={editingPerson.firstName}
                onChange={e => setEditingPerson({ ...editingPerson, firstName: e.target.value })}
                error={errors.firstName}
              />
              <Input
                label="Last Name *"
                required
                value={editingPerson.lastName}
                onChange={e => setEditingPerson({ ...editingPerson, lastName: e.target.value })}
                error={errors.lastName}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-slate-700 mb-1">Birthdate *</label>
              <input
                type="date"
                required
                value={editingPerson.dob}
                onChange={e => setEditingPerson({ ...editingPerson, dob: e.target.value })}
                className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
              />
              {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
              <div className="flex gap-4">
                {['M','F'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      required
                      value={g}
                      checked={editingPerson.sex === g}
                      onChange={e => setEditingPerson({ ...editingPerson, sex: e.target.value })}
                      className={`w-4 h-4 border-slate-300 focus:ring-2 ${g==='M' ? 'text-blue-600' : 'text-pink-600'}`}
                    />
                    <span className="text-sm">{g==='M' ? 'Male' : 'Female'}</span>
                  </label>
                ))}
              </div>
              {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
