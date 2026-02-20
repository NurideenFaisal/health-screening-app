import React, { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { usePatientRegistry } from '../../hooks/usePatientRegistry'
import {
  PatientForm, ImportModal, Modal,
  normalizeForm, validate,
} from './PatientModals'

const EMPTY = { firstName: '', lastName: '', community: '', dob: '', childId: '', sex: '' }

const TABLE_COLS = [
  { key: 'name',         label: 'Name'       },
  { key: 'childId',      label: 'Patient ID' },
  { key: 'community',    label: 'Community'  },
  { key: 'dob',          label: 'DOB'        },
  { key: 'age',          label: 'Age'        },
  { key: 'sex',          label: 'Sex'        },
  { key: 'screenCount',  label: 'Screens'    },
]

function calcAge(dob) {
  if (!dob) return 'N/A'
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? age : 0
}

function formatDOB(dob) {
  if (!dob) return ''
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const d = new Date(dob)
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function PeopleData() {
  const { profile } = useAuthStore()
  const isAdmin = profile?.role === 'admin'

  const { 
    people, 
    isLoading, 
    addPatient, 
    editPatient, 
    deletePatients, 
    isProcessing 
  } = usePatientRegistry()

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editPerson, setEdit] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editForm, setEditForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})

  const communities = [...new Set(people.map(p => p.community).filter(Boolean))]
  const filtered = people.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
    p.childId.toLowerCase().includes(query.toLowerCase())
  )

  const toggleOne = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id)))

  async function handleAdd() {
    const e = validate(form); setErrors(e)
    if (Object.keys(e).length || !profile) return
    const n = normalizeForm(form)
    try {
      await addPatient({
        first_name: n.firstName, last_name: n.lastName, gender: n.sex,
        birthdate: n.dob, community: n.community, child_code: n.childId,
        created_by: profile.id,
      })
      setShowAdd(false); setForm(EMPTY); setErrors({})
    } catch (err) {
      alert(err.code === '23505' ? 'Patient ID already exists.' : 'Error adding patient.')
    }
  }

  async function handleEdit() {
    const e = validate(editForm); setEditErrors(e)
    if (Object.keys(e).length) return
    const n = normalizeForm(editForm)
    try {
      await editPatient({
        id: editPerson.id,
        updates: { 
          first_name: n.firstName, last_name: n.lastName, gender: n.sex,
          birthdate: n.dob, community: n.community, child_code: n.childId 
        }
      })
      setEdit(null); setEditErrors({})
    } catch (err) {
      alert('Update failed.')
    }
  }

  async function deleteSelected() {
    if (!window.confirm(`Permanently delete ${selected.size} record(s)? This cannot be undone.`)) return
    try {
      await deletePatients(Array.from(selected))
      setSelected(new Set())
    } catch (err) {
      alert('Deletion failed. Some records may have linked screening data.')
    }
  }

  function handleExport() {
    const headers = ['child_code','first_name','last_name','community','birthdate','gender','screen_count']
    const csv = [
      headers.join(','),
      ...people.map(p => [p.childId, p.firstName, p.lastName, p.community, p.dob, p.sex, p.screenCount].join(','))
    ].join('\n')
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `patients_export_${new Date().toISOString().slice(0,10)}.csv`
    }).click()
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-400">Loading patient records…</p>
      </div>
    </div>
  )

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
              {selected.size > 0 && isAdmin && (
                <button onClick={deleteSelected} disabled={isProcessing}
                  className="text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition px-3 py-1.5 rounded-xl disabled:opacity-50">
                  Delete ({selected.size})
                </button>
              )}
              <button onClick={handleExport}
                className="text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-xl">
                Export CSV
              </button>
              {isAdmin && (
                <button onClick={() => setShowImport(true)}
                  className="text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition px-3 py-1.5 rounded-xl">
                  Import CSV
                </button>
              )}
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
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 accent-emerald-500 cursor-pointer" />
                </th>
                {TABLE_COLS.map(col => (
                  <th key={col.key}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const canEdit = isAdmin || p.created_by === profile?.id
                return (
                  <tr key={p.id}
                    className={`border-b border-gray-100 transition ${selected.has(p.id) ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                    <td className="w-10 px-4 py-3">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                        className="w-4 h-4 rounded border-gray-300 accent-emerald-500 cursor-pointer" />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0
                          ${p.sex === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                          {p.firstName[0]}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{p.firstName} {p.lastName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{p.childId}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{p.community}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{formatDOB(p.dob)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{calcAge(p.dob)} yrs</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg
                        ${p.sex === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                        {p.sex === 'M' ? 'Male' : 'Female'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{p.screenCount}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      {canEdit ? (
                        <button onClick={() => { setEdit(p); setEditForm({ ...p }); setEditErrors({}) }}
                          className="text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition px-2.5 py-1.5 rounded-lg">
                          Edit
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 italic">View only</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={TABLE_COLS.length + 2} className="py-12 text-center text-sm text-gray-400">
                    {query
                      ? <>No patients match <span className="font-medium text-gray-600">"{query}"</span></>
                      : 'No patients enrolled yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {selected.size > 0 ? `${selected.size} of ${filtered.length} selected` : `${people.length} total patients`}
          </p>
        </div>
      </div>

      {/* ── Modals ── */}
      <Modal show={showAdd} onClose={() => { setShowAdd(false); setErrors({}) }} title="Add New Patient">
        <PatientForm 
          data={form} 
          setData={setForm} 
          errors={errors} 
          communities={communities}
          onSave={handleAdd} 
          onCancel={() => { setShowAdd(false); setErrors({}) }}
          saveLabel="Add Patient" 
          loading={isProcessing} 
        />
      </Modal>

      <Modal show={!!editPerson} onClose={() => { setEdit(null); setEditErrors({}) }} title="Edit Patient">
        {editPerson && (
          <PatientForm 
            data={editForm} 
            setData={setEditForm} 
            errors={editErrors} 
            communities={communities}
            onSave={handleEdit} 
            onCancel={() => { setEdit(null); setEditErrors({}) }}
            saveLabel="Save Changes" 
            loading={isProcessing} 
          />
        )}
      </Modal>

      {isAdmin && (
        <ImportModal 
          show={showImport} 
          onClose={() => setShowImport(false)}
          onImport={async (rows, onDone) => {
            try {
              for (const row of rows) {
                await addPatient({ ...row, created_by: profile?.id });
              }
              setShowImport(false);
              onDone();
            } catch (err) {
              alert('Import failed: ' + err.message);
            }
          }} 
          importing={isProcessing} 
        />
      )}
    </div>
  )
}