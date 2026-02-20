import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Search, Plus, X, Pencil, Trash2 } from 'lucide-react'

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

const EMPTY_FORM = { firstName: '', lastName: '', community: '', dob: '', childId: '', sex: '' }

export default function PatientSearch() {
  const { profile } = useAuthStore()
  const [query, setQuery] = useState('')
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
    setLoading(true)
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPatients(data)
    setLoading(false)
  }

  const filtered = query.trim()
    ? patients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(query.toLowerCase()) ||
        p.child_code.toLowerCase().includes(query.toLowerCase())
      )
    : patients

  function validate(f) {
    const e = {}
    if (!f.firstName.trim()) e.firstName = 'Required'
    if (!f.lastName.trim())  e.lastName  = 'Required'
    if (!f.childId.trim())   e.childId   = 'Required'
    if (!f.dob)               e.dob       = 'Required'
    if (!f.sex)               e.sex       = 'Required'
    if (!f.community.trim()) e.community = 'Required'
    return e
  }

  async function handleSave() {
    const e = validate(form)
    setErrors(e)
    if (Object.keys(e).length) return

    const payload = {
      first_name: form.firstName,
      last_name: form.lastName,
      child_code: form.childId,
      birthdate: form.dob,
      gender: form.sex,
      community: form.community,
    }

    if (form.id) {
      const { error } = await supabase.from('children').update(payload).eq('id', form.id)
      if (!error) fetchPatients()
    } else {
      const { error } = await supabase.from('children').insert({ ...payload, created_by: profile?.id })
      if (!error) fetchPatients()
    }
    cancelEnroll()
  }

  async function handleDelete(id, creatorId) {
    if (creatorId !== profile?.id) return
    if (!window.confirm("Delete patient?")) return
    const { error } = await supabase.from('children').delete().eq('id', id)
    if (!error) fetchPatients()
  }

  function startEdit(p) {
    setForm({
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      childId: p.child_code,
      community: p.community,
      dob: p.birthdate,
      sex: p.gender
    })
    setEnrolling(true)
  }

  function cancelEnroll() {
    setEnrolling(false)
    setForm(EMPTY_FORM)
    setErrors({})
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700
          placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-400 transition
          ${errors[key] ? 'ring-2 ring-red-400' : ''}`}
      />
      {errors[key] && <p className="text-xs text-red-400 mt-0.5">{errors[key]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 lg:p-10 font-sans">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full sm:max-w-lg sm:mx-auto lg:max-w-2xl">

        {/* ── Header ── */}
        <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">Patients</h2>
              <p className="text-xs text-gray-400 mt-0.5">{filtered.length} found</p>
            </div>
            {!enrolling && (
              <button
                onClick={() => setEnrolling(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-white
                           bg-emerald-500 hover:bg-emerald-600 transition
                           px-3 py-1.5 rounded-xl"
              >
                <Plus size={14} strokeWidth={2.5} />
                Enroll Patient
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 sm:py-2.5">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Name or patient ID…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
            />
            {query && (
              <X size={14} className="text-gray-400 cursor-pointer" onClick={() => setQuery('')} />
            )}
          </label>
        </div>

        {/* ── Enroll form ── */}
        {enrolling && (
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {form.id ? 'Edit Patient' : 'New Patient'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {field('firstName', 'First name', 'text', 'Kwame')}
              {field('lastName',  'Last name',  'text', 'Mensah')}
            </div>

            {field('childId',   'Patient ID',    'text', 'GH0007')}
            {field('community', 'Community',     'text', '')}
            {field('dob',       'Date of birth', 'date')}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sex</label>
              <div className="flex gap-3">
                {['M', 'F'].map(g => (
                  <label key={g} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm cursor-pointer transition
                    ${form.sex === g ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'bg-gray-100 text-gray-500'}`}>
                    <input type="radio" value={g} checked={form.sex === g}
                      onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                      className="sr-only" />
                    {g === 'M' ? 'Male' : 'Female'}
                  </label>
                ))}
              </div>
              {errors.sex && <p className="text-xs text-red-400 mt-0.5">{errors.sex}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={cancelEnroll}
                className="flex-1 py-2 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition font-medium">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition font-medium">
                {form.id ? 'Update' : 'Enroll'}
              </button>
            </div>
          </div>
        )}

        {/* ── Patient list ── */}
        <ul>
          {filtered.map((p, i) => (
            <React.Fragment key={p.id}>
              <li className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-3.5">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                  text-white text-sm font-bold shrink-0
                  ${p.gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                  {p.first_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {p.first_name} {p.last_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {p.child_code} · {p.gender === 'M' ? 'Male' : 'Female'} · {calcAge(p.birthdate)} yrs · {p.community}  
                  </p>
                </div>

                {/* Icons - Default visible for owner */}
                {p.created_by === profile?.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(p)} className="p-1.5 text-emerald-500">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id, p.created_by)} className="p-1.5 text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
              {i < filtered.length - 1 && <div className="mx-4 sm:mx-6 border-t border-gray-100" />}
            </React.Fragment>
          ))}

          {filtered.length === 0 && !loading && (
            <li className="py-10 sm:py-12 text-center space-y-3">
              <p className="text-sm text-gray-400">
                No patient found for <span className="font-medium text-gray-600">"{query}"</span>
              </p>
              {!enrolling && (
                <button
                  onClick={() => setEnrolling(true)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition underline underline-offset-2"
                >
                  Enroll as new patient
                </button>
              )}
            </li>
          )}
        </ul>

        {/* ── Footer ── */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Can't find a patient? Enroll them above.
          </p>
        </div>

      </div>
    </div>
  )
}