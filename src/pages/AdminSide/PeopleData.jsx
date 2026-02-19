import React, { useState, useRef, useEffect } from 'react'

// ── Utilities ─────────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return ''
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function formatDOB(dob) {
  if (!dob) return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const d = new Date(dob)
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function validate(p) {
  const e = {}
  if (!p.firstName?.trim()) e.firstName = 'Required'
  if (!p.lastName?.trim())  e.lastName  = 'Required'
  if (!p.community?.trim()) e.community = 'Required'
  if (!p.childId?.trim())   e.childId   = 'Required'
  if (!p.dob)               e.dob       = 'Required'
  else if (isNaN(new Date(p.dob))) e.dob = 'Invalid date'
  if (!['M','F'].includes(p.sex)) e.sex = 'Required'
  return e
}

const EMPTY = { firstName: '', lastName: '', community: '', dob: '', childId: '', sex: '' }

// ── Form sub-components ───────────────────────────────────────────────────────
function TextInput({ error, ...props }) {
  return (
    <input
      className={`w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700
        placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-400 transition
        ${error ? 'ring-2 ring-red-400' : ''}`}
      {...props}
    />
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

function AutocompleteInput({ value, onChange, suggestions = [], error, ...props }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filtered = value
    ? suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <TextInput value={value} error={error}
        onChange={e => { onChange(e); setOpen(true) }}
        onFocus={() => setOpen(true)} {...props} />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
          {filtered.map((s, i) => (
            <div key={i} onMouseDown={() => { onChange({ target: { value: s } }); setOpen(false) }}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Modal — used for add & edit on the admin/desktop view
function Modal({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Modal header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition text-sm">✕</button>
        </div>
        {/* Modal body */}
        <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

function PatientForm({ data, setData, errors, onSave, onCancel, saveLabel, communities = [] }) {
  const f = (key, label, type = 'text', placeholder = '') => (
    <Field label={label} error={errors[key]}>
      <TextInput type={type} value={data[key]} placeholder={placeholder} error={errors[key]}
        onChange={e => setData(d => ({ ...d, [key]: e.target.value }))} />
    </Field>
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {f('firstName', 'First name', 'text', 'Kwame')}
        {f('lastName',  'Last name',  'text', 'Mensah')}
      </div>
      {f('childId', 'Patient ID', 'text', 'GH0007')}
      <Field label="Community" error={errors.community}>
        <AutocompleteInput value={data.community} error={errors.community}
          onChange={e => setData(d => ({ ...d, community: e.target.value }))}
          suggestions={communities} placeholder="e.g. Asokwa" />
      </Field>
      {f('dob', 'Date of birth', 'date')}
      <Field label="Sex" error={errors.sex}>
        <div className="flex gap-2">
          {['M', 'F'].map(g => (
            <label key={g} className={`flex-1 flex items-center justify-center py-2 rounded-xl text-sm cursor-pointer transition font-medium
              ${data.sex === g ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              <input type="radio" value={g} checked={data.sex === g}
                onChange={e => setData(d => ({ ...d, sex: e.target.value }))} className="sr-only" />
              {g === 'M' ? 'Male' : 'Female'}
            </label>
          ))}
        </div>
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition font-medium">
          Cancel
        </button>
        <button onClick={onSave}
          className="flex-1 py-2.5 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition font-medium">
          {saveLabel}
        </button>
      </div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const INITIAL = [
  { id: 1, firstName: 'Kwame',  lastName: 'Mensah',  community: 'Asokwa',  dob: '2017-02-15', childId: 'GH0001', sex: 'M', screenCount: 3 },
  { id: 2, firstName: 'Ama',    lastName: 'Asante',  community: 'Bantama', dob: '2016-03-20', childId: 'GH0002', sex: 'F', screenCount: 5 },
  { id: 3, firstName: 'Kofi',   lastName: 'Owusu',   community: 'Asokwa',  dob: '2019-06-05', childId: 'GH0003', sex: 'M', screenCount: 2 },
  { id: 4, firstName: 'Akua',   lastName: 'Boateng', community: 'Adum',    dob: '2013-10-10', childId: 'GH0004', sex: 'F', screenCount: 7 },
  { id: 5, firstName: 'Yaw',    lastName: 'Osei',    community: 'Bantama', dob: '2012-12-17', childId: 'GH0005', sex: 'M', screenCount: 4 },
  { id: 6, firstName: 'Abena',  lastName: 'Appiah',  community: 'Adum',    dob: '2012-07-23', childId: 'GH0006', sex: 'F', screenCount: 1 },
]

const COLS = [
  { key: 'name',        label: 'Name'       },
  { key: 'childId',     label: 'Patient ID' },
  { key: 'community',   label: 'Community'  },
  { key: 'dob',         label: 'DOB'        },
  { key: 'age',         label: 'Age'        },
  { key: 'sex',         label: 'Sex'        },
  { key: 'screenCount', label: 'Screens'    },
]

export default function PeopleData() {
  const [people, setPeople]     = useState(INITIAL)
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(new Set())
  const [showAdd, setShowAdd]   = useState(false)
  const [editPerson, setEdit]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [editForm, setEditForm] = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [editErrors, setEditErrors] = useState({})
  const fileRef = useRef(null)

  const communities = [...new Set(people.map(p => p.community).filter(Boolean))]

  const filtered = people.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    p.childId.toLowerCase().includes(query.toLowerCase())
  )

  // Selection
  const toggleOne = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))
  const deleteSelected = () => { setPeople(p => p.filter(x => !selected.has(x.id))); setSelected(new Set()) }

  // Add
  function handleAdd() {
    const e = validate(form); setErrors(e)
    if (Object.keys(e).length) return
    setPeople(p => [...p, { ...form, id: Math.max(...p.map(x => x.id), 0) + 1, screenCount: 0 }])
    setShowAdd(false); setForm(EMPTY); setErrors({})
  }

  // Edit
  function handleEdit() {
    const e = validate(editForm); setEditErrors(e)
    if (Object.keys(e).length) return
    setPeople(p => p.map(x => x.id === editPerson.id ? { ...editForm, id: x.id, screenCount: x.screenCount } : x))
    setEdit(null); setEditErrors({})
  }

  // Export
  function handleExport() {
    const headers = ['childId','firstName','lastName','community','dob','sex','screenCount']
    const csv = [headers.join(','), ...people.map(p => headers.map(h => p[h]).join(','))].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'patients.csv'
    })
    a.click()
  }

  // Import
  function handleImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l => l.trim())
      if (lines.length < 2) return
      const headers = lines[0].split(',').map(h => h.trim())
      let maxId = Math.max(...people.map(p => p.id), 0)
      const newPeople = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim())
        const row = Object.fromEntries(headers.map((h, j) => [h, vals[j]]))
        return { ...row, id: ++maxId, screenCount: parseInt(row.screenCount) || 0 }
      })
      setPeople(p => [...p, ...newPeople])
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 sm:px-6 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Patient Records</h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} patients</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selected.size > 0 && (
                <button onClick={deleteSelected}
                  className="text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition px-3 py-1.5 rounded-xl">
                  Delete ({selected.size})
                </button>
              )}
              <button onClick={handleExport}
                className="text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-xl">
                Export CSV
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-xl">
                Import CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
              <button onClick={() => { setShowAdd(true); setForm(EMPTY); setErrors({}) }}
                className="flex items-center gap-1.5 text-xs font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition px-3 py-1.5 rounded-xl">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Patient
              </button>
            </div>
          </div>

          {/* Search */}
          <label className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor"
              strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or patient ID…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0" />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 transition text-xs shrink-0">✕</button>
            )}
          </label>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                {/* Select all */}
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 accent-emerald-500 cursor-pointer" />
                </th>
                {COLS.map(col => (
                  <th key={col.key}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                {/* Actions col */}
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id}
                  className={`border-b border-gray-100 transition
                    ${selected.has(p.id) ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-emerald-500 cursor-pointer" />
                  </td>

                  {/* Name */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0
                        ${p.sex === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                        {p.firstName[0]}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{p.firstName} {p.lastName}</span>
                    </div>
                  </td>

                  {/* Patient ID */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{p.childId}</span>
                  </td>

                  {/* Community */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{p.community}</td>

                  {/* DOB */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{formatDOB(p.dob)}</td>

                  {/* Age */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{calcAge(p.dob)} yrs</td>

                  {/* Sex */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg
                      ${p.sex === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                      {p.sex === 'M' ? 'Male' : 'Female'}
                    </span>
                  </td>

                  {/* Screen count */}
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{p.screenCount}</td>

                  {/* Edit */}
                  <td className="px-3 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => { setEdit(p); setEditForm({ ...p }); setEditErrors({}) }}
                      className="text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition px-2.5 py-1.5 rounded-lg">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLS.length + 2} className="py-12 text-center text-sm text-gray-400">
                    No patients match <span className="font-medium text-gray-600">"{query}"</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {selected.size > 0
              ? `${selected.size} of ${filtered.length} selected`
              : `${people.length} total patients`}
          </p>
        </div>
      </div>

      {/* ── Add Modal ── */}
      <Modal show={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Add New Patient">
        <PatientForm data={form} setData={setForm} errors={errors} communities={communities}
          onSave={handleAdd} onCancel={() => { setShowAdd(false); setErrors({}) }} saveLabel="Add Patient" />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal show={!!editPerson} onClose={() => { setEdit(null); setEditErrors({}) }} title="Edit Patient">
        {editPerson && (
          <PatientForm data={editForm} setData={setEditForm} errors={editErrors} communities={communities}
            onSave={handleEdit} onCancel={() => { setEdit(null); setEditErrors({}) }} saveLabel="Save Changes" />
        )}
      </Modal>
    </div>
  )
}