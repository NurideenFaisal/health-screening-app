import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  Search, Plus, Edit2, X, Clock,
  ChevronRight, CheckCircle2, Circle
} from 'lucide-react'

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
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

const AutocompleteInput = ({ label, error, value, onChange, suggestions = [], ...props }) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e); setShowSuggestions(true) }}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => { onChange({ target: { value: s } }); setShowSuggestions(false) }}
              className="px-3 py-2 text-sm hover:bg-emerald-50 cursor-pointer transition"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const SectionProgress = ({ s1, s2, s3 }) => {
  const sections = [
    { label: 'S1', done: s1 },
    { label: 'S2', done: s2 },
    { label: 'S3', done: s3 },
  ]
  return (
    <div className="flex items-center gap-1">
      {sections.map((s, i) => (
        <React.Fragment key={s.label}>
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${s.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
            {s.done
              ? <CheckCircle2 size={10} className="flex-shrink-0" />
              : <Circle size={10} className="flex-shrink-0" />
            }
            <span>{s.label}</span>
          </div>
          {i < 2 && <div className={`w-3 h-px ${s.done ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function ClinicianPatientData() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const section = profile?.section ?? null

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [errors, setErrors] = useState({})

  const [people, setPeople] = useState([
    { id: 1, firstName: 'Kwame',  lastName: 'Mensah',  community: 'Asokwa',  dob: '2017-02-15', childId: 'GH0001', sex: 'M', screenCount: 3, section1Complete: true,  section2Complete: true,  section3Complete: false },
    { id: 2, firstName: 'Ama',    lastName: 'Asante',  community: 'Bantama', dob: '2016-03-20', childId: 'GH0002', sex: 'F', screenCount: 5, section1Complete: true,  section2Complete: false, section3Complete: false },
    { id: 3, firstName: 'Kofi',   lastName: 'Owusu',   community: 'Asokwa',  dob: '2019-06-05', childId: 'GH0003', sex: 'M', screenCount: 2, section1Complete: false, section2Complete: false, section3Complete: false },
    { id: 4, firstName: 'Akua',   lastName: 'Boateng', community: 'Adum',    dob: '2013-10-10', childId: 'GH0004', sex: 'F', screenCount: 7, section1Complete: true,  section2Complete: true,  section3Complete: true  },
    { id: 5, firstName: 'Yaw',    lastName: 'Osei',    community: 'Bantama', dob: '2012-12-17', childId: 'GH0005', sex: 'M', screenCount: 4, section1Complete: false, section2Complete: false, section3Complete: false },
    { id: 6, firstName: 'Abena',  lastName: 'Appiah',  community: 'Adum',    dob: '2012-07-23', childId: 'GH0006', sex: 'F', screenCount: 1, section1Complete: true,  section2Complete: false, section3Complete: false },
  ])

  const [newPatient, setNewPatient] = useState({
    firstName: '', lastName: '', community: '', dob: '', childId: 'GH', sex: ''
  })

  const uniqueCommunities = [...new Set(people.map(p => p.community).filter(Boolean))]

  const calculateAge = dob => {
    if (!dob) return ''
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const getInitials = name => name?.charAt(0).toUpperCase() || '?'
  const getSexColor = sex => sex === 'M' ? 'bg-blue-300' : 'bg-pink-400'

  const getSectionStatus = (person) => {
    if (!section) return null
    if (section === '1') return person.section1Complete ? 'done' : 'ready'
    if (section === '2') {
      if (person.section2Complete) return 'done'
      if (!person.section1Complete) return 'blocked'
      return 'ready'
    }
    if (section === '3') {
      if (person.section3Complete) return 'done'
      if (!person.section2Complete) return 'blocked'
      return 'ready'
    }
    return null
  }

  const STATUS_CHIP = {
    ready:   { label: `Ready — Sec ${section}`, cls: 'bg-blue-100 text-blue-700' },
    done:    { label: 'Completed',               cls: 'bg-emerald-100 text-emerald-700' },
    blocked: { label: 'Awaiting prev. section',  cls: 'bg-amber-100 text-amber-700' },
  }

  const filtered = people.filter(p =>
    p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.childId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const validate = patient => {
    const errs = {}
    if (!patient.firstName) errs.firstName = 'Required'
    if (!patient.lastName)  errs.lastName  = 'Required'
    if (!patient.community) errs.community = 'Required'
    if (!patient.childId)   errs.childId   = 'Required'
    if (!patient.dob)       errs.dob       = 'Required'
    else if (isNaN(new Date(patient.dob))) errs.dob = 'Invalid date'
    if (!['M', 'F'].includes(patient.sex)) errs.sex = 'Select gender'
    return errs
  }

  const handleAdd = () => {
    const errs = validate(newPatient)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const newId = Math.max(...people.map(p => p.id), 0) + 1
    setPeople([...people, {
      ...newPatient, id: newId, screenCount: 0,
      section1Complete: false, section2Complete: false, section3Complete: false
    }])
    setNewPatient({ firstName: '', lastName: '', community: '', dob: '', childId: 'GH', sex: '' })
    setShowAddModal(false)
    setErrors({})
  }

  const handleSaveEdit = () => {
    const errs = validate(editingPerson)
    setErrors(errs)
    if (Object.keys(errs).length) return
    setPeople(people.map(p => p.id === editingPerson.id ? editingPerson : p))
    setEditingPerson(null)
    setErrors({})
  }

  const handleRowClick = (person) => {
    const status = getSectionStatus(person)
    if (status === 'ready') navigate(`/clinician/patient/${person.childId}`)
  }

  const renderFormFields = (data, setData) => (
    <>
      <Input
        label="Child ID *"
        value={data.childId}
        onChange={e => setData({ ...data, childId: e.target.value })}
        error={errors.childId}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name *"
          value={data.firstName}
          onChange={e => setData({ ...data, firstName: e.target.value })}
          error={errors.firstName}
        />
        <Input
          label="Last Name *"
          value={data.lastName}
          onChange={e => setData({ ...data, lastName: e.target.value })}
          error={errors.lastName}
        />
      </div>
      <AutocompleteInput
        label="Community *"
        value={data.community}
        onChange={e => setData({ ...data, community: e.target.value })}
        suggestions={uniqueCommunities}
        error={errors.community}
        placeholder="Type or select community"
      />
      <div className="flex flex-col">
        <label className="text-sm font-medium text-slate-700 mb-1">Birthdate *</label>
        <input
          type="date"
          value={data.dob}
          onChange={e => setData({ ...data, dob: e.target.value })}
          className={`border rounded-lg px-3 py-2 text-sm focus:ring-2 ${errors.dob ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'}`}
        />
        {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
        <div className="flex gap-4">
          {['M', 'F'].map(g => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={g}
                checked={data.sex === g}
                onChange={e => setData({ ...data, sex: e.target.value })}
                className="w-4 h-4"
              />
              <span className="text-sm">{g === 'M' ? 'Male' : 'Female'}</span>
            </label>
          ))}
        </div>
        {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
      </div>
    </>
  )

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50">

      {/* Toolbar */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-wrap justify-between gap-3 items-center">
          <div>
            <h1 className="text-base font-bold text-slate-800">Patient Data</h1>
            <p className="text-xs text-slate-500">
              {filtered.length} patient{filtered.length !== 1 ? 's' : ''} found
              {section && <span className="ml-1">· Section {section} view</span>}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Name or Child ID..."
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-56 lg:w-72"
              />
            </div>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} /> Add Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Patient Cards */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-2">
        {filtered.map(person => {
          const status = getSectionStatus(person)
          const chip = status ? STATUS_CHIP[status] : null
          const isReady = status === 'ready'

          return (
            <div
              key={person.id}
              onClick={() => handleRowClick(person)}
              className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 transition hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 ${isReady ? 'cursor-pointer border-slate-200' : 'cursor-default border-slate-100'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full ${getSexColor(person.sex)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getInitials(person.firstName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {person.firstName} {person.lastName}
                    </p>
                    {chip && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${chip.cls}`}>
                        {chip.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {person.childId} · {person.community} · {person.sex === 'M' ? 'Male' : 'Female'} · {calculateAge(person.dob)} yrs
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <SectionProgress
                      s1={person.section1Complete}
                      s2={person.section2Complete}
                      s3={person.section3Complete}
                    />
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <Clock size={11} />
                      <span>{person.screenCount} screen{person.screenCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setEditingPerson(person); setErrors({}) }}
                  className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit2 size={15} />
                </button>
                {isReady
                  ? <ChevronRight size={18} className="text-emerald-500" />
                  : <div className="w-[18px]" />
                }
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 text-sm">
            No patients match your search
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        show={showAddModal}
        onClose={() => { setShowAddModal(false); setErrors({}) }}
        title="Add New Patient"
        actions={[
          <Button key="cancel" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
            onClick={() => { setShowAddModal(false); setErrors({}) }}>
            Cancel
          </Button>,
          <Button key="add" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleAdd}>
            Add Patient
          </Button>
        ]}
      >
        {renderFormFields(newPatient, setNewPatient)}
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={!!editingPerson}
        onClose={() => { setEditingPerson(null); setErrors({}) }}
        title="Edit Patient"
        actions={[
          <Button key="cancel" className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
            onClick={() => { setEditingPerson(null); setErrors({}) }}>
            Cancel
          </Button>,
          <Button key="save" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleSaveEdit}>
            Save Changes
          </Button>
        ]}
      >
        {editingPerson && renderFormFields(editingPerson, setEditingPerson)}
      </Modal>

    </div>
  )
}