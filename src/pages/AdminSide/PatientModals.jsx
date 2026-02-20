// ── PatientModals.jsx ─────────────────────────────────────────────────────────
// Contains: normalization utils, shared UI primitives, PatientForm, ImportModal
// Imported by: PeopleData.jsx
import React, { useState, useRef } from 'react'

// ── Normalization ─────────────────────────────────────────────────────────────
export function toTitleCase(str) {
  if (!str) return ''
  return str.trim().replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export function normalizeId(str) {
  if (!str) return ''
  return str.trim().toUpperCase().replace(/\s+/g, '')
}

export function normalizeSex(str) {
  if (!str) return ''
  const s = str.trim().toUpperCase()
  if (s === 'M' || s === 'MALE') return 'M'
  if (s === 'F' || s === 'FEMALE') return 'F'
  return s.charAt(0)
}

export function normalizeDate(str) {
  if (!str) return ''
  const d = new Date(str)
  if (isNaN(d)) return str
  return d.toISOString().slice(0, 10)
}

export function normalizeForm(f) {
  return {
    ...f,
    firstName: toTitleCase(f.firstName),
    lastName: toTitleCase(f.lastName),
    childId: normalizeId(f.childId),
    community: toTitleCase(f.community),
    dob: normalizeDate(f.dob),
    sex: normalizeSex(f.sex),
  }
}

export function normalizeRow(r) {
  return {
    first_name: toTitleCase(r.first_name),
    last_name: toTitleCase(r.last_name),
    child_code: normalizeId(r.child_code),
    community: toTitleCase(r.community),
    birthdate: normalizeDate(r.birthdate),
    gender: normalizeSex(r.gender),
  }
}

export function validate(p) {
  const e = {}
  if (!p.firstName?.trim()) e.firstName = 'Required'
  if (!p.lastName?.trim()) e.lastName = 'Required'
  if (!p.community?.trim()) e.community = 'Required'
  if (!p.childId?.trim()) e.childId = 'Required'
  if (!p.dob) e.dob = 'Required'
  if (!['M', 'F'].includes(normalizeSex(p.sex))) e.sex = 'Required'
  return e
}

// ── CSV config ────────────────────────────────────────────────────────────────
export const CSV_HEADERS = ['child_code', 'first_name', 'last_name', 'community', 'birthdate', 'gender']
export const CSV_EXAMPLE = ['GH0099', 'Faisal', 'Nurideen', 'Obuasi', '2018-04-10', 'M']

// ── Shared UI primitives ──────────────────────────────────────────────────────
export function TextInput({ error, ...props }) {
  return (
    <input
      className={`w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700
        placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-400 transition
        ${error ? 'ring-2 ring-red-400' : ''}`}
      {...props}
    />
  )
}

export function Field({ label, hint, error, children }) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-500">{label}</label>
          {hint && <span className="text-xs text-gray-300">{hint}</span>}
        </div>
      )}
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

export function Modal({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── PatientForm ───────────────────────────────────────────────────────────────
export function PatientForm({ data, setData, errors, onSave, onCancel, saveLabel, communities = [], loading }) {
  const f = (key, label, type = 'text', placeholder = '', hint = '') => (
    <Field label={label} hint={hint} error={errors[key]}>
      <TextInput type={type} value={data[key]} placeholder={placeholder} error={errors[key]}
        onChange={e => setData(d => ({ ...d, [key]: e.target.value }))} />
    </Field>
  )

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {/* Removed hints from f() calls */}
        {f('firstName', 'First name', 'text', '')}
        {f('lastName', 'Last name', 'text', '')}
      </div>

      {f('childId', 'Patient ID', 'text', 'e.g. GH0007')}

      <Field label="Community" error={errors.community}>
        <input
          list="comm-list"
          value={data.community}
          placeholder=""
          onChange={e => setData(d => ({ ...d, community: e.target.value }))}
          className={`w-full bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700
        placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-400 transition
        ${errors.community ? 'ring-2 ring-red-400' : ''}`}
        />
        <datalist id="comm-list">
          {communities.map(c => <option key={c} value={c} />)}
        </datalist>
      </Field>

      {f('dob', 'Date of birth', 'date')}

      <Field label="Sex" error={errors.sex}>
        <div className="flex gap-2">
          {['M', 'F'].map(g => (
            <label key={g} className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm cursor-pointer transition font-bold
          ${data.sex === g
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500'}`}>
              <input
                type="radio"
                value={g}
                checked={data.sex === g}
                onChange={e => setData(d => ({ ...d, sex: e.target.value }))}
                className="sr-only"
              />
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
        <button onClick={onSave} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition font-medium disabled:opacity-50">
          {loading ? 'Saving…' : saveLabel}
        </button>
      </div>
    </>
  )
}

// ── ImportModal ───────────────────────────────────────────────────────────────
export function ImportModal({ show, onClose, onImport, importing }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [parseError, setParseError] = useState('')

  function downloadTemplate() {
    const csv = [CSV_HEADERS.join(','), CSV_EXAMPLE.join(',')].join('\n')
    Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: 'patient_import_template.csv'
    }).click()
  }

  function handleFile(e) {
    const f = e.target.files?.[0]; if (!f) return
    setFile(f); setParseError(''); setPreview([])
    const reader = new FileReader()
    reader.onload = ev => {
      const lines = ev.target.result.split('\n').filter(l => l.trim())
      if (lines.length < 2) { setParseError('File has no data rows.'); return }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const missing = CSV_HEADERS.filter(h => !headers.includes(h))
      if (missing.length) { setParseError(`Missing columns: ${missing.join(', ')}`); return }
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim())
        return Object.fromEntries(headers.map((h, j) => [h, vals[j]]))
      })
      const rowErrors = []
      rows.forEach((r, i) => {
        if (!r.child_code?.trim()) rowErrors.push(`Row ${i + 2}: missing child_code`)
        if (!r.first_name?.trim()) rowErrors.push(`Row ${i + 2}: missing first_name`)
        if (!r.last_name?.trim()) rowErrors.push(`Row ${i + 2}: missing last_name`)
        if (!r.community?.trim()) rowErrors.push(`Row ${i + 2}: missing community`)
        if (!r.birthdate?.trim() || isNaN(new Date(r.birthdate))) rowErrors.push(`Row ${i + 2}: invalid birthdate`)
        if (!['M', 'F', 'm', 'f', 'Male', 'Female', 'MALE', 'FEMALE'].includes(r.gender?.trim()))
          rowErrors.push(`Row ${i + 2}: gender must be M or F`)
      })
      if (rowErrors.length) { setParseError(rowErrors.join('\n')); return }
      setPreview(rows.map(normalizeRow))
    }
    reader.readAsText(f)
  }

  function reset() {
    setFile(null); setPreview([]); setParseError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Modal show={show} onClose={() => { reset(); onClose() }} title="Import Patients">

      {/* Step 1 */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 1 — Get the template</p>
        <p className="text-xs text-gray-400">
          Required columns: <span className="font-mono text-gray-600">{CSV_HEADERS.join(', ')}</span>
        </p>
        <p className="text-xs text-gray-400">Names and community are auto Title Cased. IDs are auto-uppercased.</p>
        <button onClick={downloadTemplate}
          className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition px-3 py-2 rounded-lg w-full justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download Template
        </button>
      </div>

      {/* Step 2 */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 2 — Upload filled CSV</p>
        <label onClick={() => fileRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition
            ${file && !parseError ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}>
          <svg className={`w-6 h-6 ${file && !parseError ? 'text-emerald-500' : 'text-gray-300'}`}
            fill="none" stroke="currentColor" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          {file
            ? <span className="text-xs font-medium text-emerald-600">{file.name}</span>
            : <span className="text-xs text-gray-400">Click to choose a CSV file</span>}
        </label>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        {file && <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition">Remove file</button>}
      </div>

      {/* Errors */}
      {parseError && (
        <div className="bg-red-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-500 mb-1">Fix these issues before importing:</p>
          <pre className="text-xs text-red-400 whitespace-pre-wrap">{parseError}</pre>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Preview (normalized) — {preview.length} patient{preview.length !== 1 ? 's' : ''}
          </p>
          <div className="rounded-xl border border-gray-100 overflow-hidden max-h-40 overflow-y-auto">
            {preview.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
                  ${r.gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                  {r.first_name[0]}
                </div>
                <span className="font-medium text-gray-700">{r.first_name} {r.last_name}</span>
                <span className="text-gray-300">·</span>
                <span className="font-mono text-gray-500">{r.child_code}</span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-400">{r.community}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => { reset(); onClose() }}
          className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition font-medium">
          Cancel
        </button>
        <button onClick={() => onImport(preview, reset)}
          disabled={preview.length === 0 || importing}
          className="flex-1 py-2.5 rounded-xl text-sm text-white bg-emerald-500 hover:bg-emerald-600 transition font-medium disabled:opacity-40">
          {importing ? 'Importing…' : `Import ${preview.length > 0 ? preview.length : ''} Patients`}
        </button>
      </div>
    </Modal>
  )
}