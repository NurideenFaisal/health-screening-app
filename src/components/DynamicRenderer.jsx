import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useScreeningSection } from '../hooks/useScreeningSection'
import { calculateField, isFieldVisible, validateField } from '../lib/logicEngine'
import { Button, EmptyState, Skeleton, StatusBadge } from './ui/primitives'

// ── Input Styles ──────────────────────────────────────────────────────────────
const inputClass = 'w-full bg-gray-100 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-emerald-400 transition'
const labelClass = 'mb-1 block text-xs font-semibold text-gray-500 Capitalize tracking-wide'

// ── Field Components ──────────────────────────────────────────────────────────
const RadioGroup = ({ options = [], value, onChange }) => (
  <div className="mt-1 flex flex-wrap gap-2">
    {options.map(option => (
      <button key={option.v} type="button" onClick={() => onChange(option.v)}
        className={`min-h-[42px] cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-[0.97] ${value === option.v ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'}`}>
        {option.l || option.v}
      </button>
    ))}
  </div>
)

const TextInput = ({ type = 'text', value, onChange, placeholder, step, min, max }) => (
  <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Enter value'} step={step} min={min} max={max} className={inputClass} />
)

const SelectInput = ({ options = [], value, onChange, placeholder }) => (
  <select value={value || ''} onChange={e => onChange(e.target.value)} className={inputClass}>
    <option value="">{placeholder || 'Select...'}</option>
    {options.map(o => <option key={o.v} value={o.v}>{o.l || o.v}</option>)}
  </select>
)

const CheckboxInput = ({ label, checked, onChange }) => (
  <label className="flex min-h-[42px] cursor-pointer items-center gap-3 rounded-xl bg-gray-100 px-3 py-2 transition hover:bg-gray-200">
    <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </label>
)

const TextAreaInput = ({ value, onChange, placeholder, rows = 1, presets = [] }) => (
  <div>
    <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Enter details'} rows={rows}
      className={`${inputClass} resize-none py-1.5`} />
    {presets.length > 0 && (
      <div className="mt-1.5 flex flex-wrap gap-1">
        {presets.map((p, i) => (
          <button key={i} type="button" onClick={() => onChange(p.l)}
            className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] text-slate-600 transition hover:bg-gray-200 hover:text-slate-700 active:scale-[0.97]">
            {p.l}
          </button>
        ))}
      </div>
    )}
  </div>
)

const FieldLabel = ({ label, required }) => (
  <label className={labelClass}>{label || 'Untitled'}{required && <span className="ml-0.5 text-rose-500">*</span>}</label>
)

// ── Progress Indicator ────────────────────────────────────────────────────────
function SectionProgress({ fields, formData }) {
  const total = fields?.length || 0
  if (total === 0) return null
  const filled = fields.filter(f => formData[f.id] && formData[f.id] !== '').length
  const pct = Math.round((filled / total) * 100)
  return (
    <div className="mb-3 flex items-center gap-2 text-[10px] text-slate-400">
      <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-medium tabular-nums">{filled}/{total}</span>
    </div>
  )
}

// ── Section Card ──────────────────────────────────────────────────────────────
function DynamicFieldGroup({ group, schema, formData, onChange, errors }) {
  const color = group.color || '#059669'
  return (
    <section className="mb-4 overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: `${color}40` }}>
      <div className="flex items-center gap-2 border-b px-5 py-3" style={{ backgroundColor: `${color}0A`, borderColor: `${color}20` }}>
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-slate-800">{group.label || 'Section'}</h3>
        <span className="ml-auto text-[10px] text-slate-400">{group.fields?.length || 0} fields</span>
      </div>
      <div className="p-5">
        <SectionProgress fields={group.fields} formData={formData} />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {(group.fields || []).map(field => (
            <DynamicField key={field.id} field={field} schema={schema} formData={formData} onChange={onChange} errors={errors} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function FormGroupSkeleton() {
  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="ml-auto h-3 w-8" />
      </div>
      <div className="p-5">
        <Skeleton className="mb-3 h-1.5 w-full rounded-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <div><Skeleton className="mb-2 h-3 w-20" /><Skeleton className="h-10 w-full rounded-xl" /></div>
          <div><Skeleton className="mb-2 h-3 w-24" /><Skeleton className="h-10 w-full rounded-xl" /></div>
        </div>
      </div>
    </section>
  )
}

// ── Dynamic Field ─────────────────────────────────────────────────────────────
function DynamicField({ field, schema, formData, onChange, errors }) {
  if (!isFieldVisible(field, formData)) return null

  const value = formData[field.id] ?? ''
  const fieldErrors = errors?.[field.id] || []
  const handleChange = nextValue => onChange(field.id, nextValue)
  const isFullWidth = ['textarea', 'checkbox'].includes(field.type) || (field.type === 'radio' && field.options?.length > 3)

  if (field.type === 'computed') {
    const cv = calculateField(schema?.groups, field.id, formData)
    return (
      <div className={isFullWidth ? 'md:col-span-2' : ''}>
        <FieldLabel label={field.label} required={field.required} />
        <div className="mt-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 font-mono text-sm text-violet-700">{cv !== null ? cv : '(auto)'}</div>
        {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
      </div>
    )
  }

  return (
    <div className={isFullWidth ? 'md:col-span-2' : ''}>
      {field.type === 'checkbox' ? (
        <CheckboxInput label={field.label} checked={value} onChange={handleChange} />
      ) : field.type === 'radio' ? (
        <div><FieldLabel label={field.label} required={field.required} /><RadioGroup options={field.options} value={value} onChange={handleChange} /></div>
      ) : field.type === 'dropdown' || field.type === 'select' ? (
        <div><FieldLabel label={field.label} required={field.required} /><SelectInput options={field.options} value={value} onChange={handleChange} placeholder="Select..." /></div>
      ) : field.type === 'textarea' ? (
        <div><FieldLabel label={field.label} required={field.required} /><TextAreaInput value={value} onChange={handleChange} placeholder={field.help} rows={1} presets={field.presets || []} /></div>
      ) : (
        <div><FieldLabel label={field.label} required={field.required} /><TextInput type={field.type === 'number' ? 'number' : 'text'} value={value} onChange={handleChange} placeholder={field.help} step={field.step} min={field.min} max={field.max} /></div>
      )}
      {field.help && !['checkbox', 'radio', 'dropdown', 'select', 'textarea'].includes(field.type) && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
      {fieldErrors.length > 0 && <p className="mt-1 text-xs text-rose-500">{fieldErrors[0]}</p>}
    </div>
  )
}

function findFieldById(schema, fieldId) {
  if (!schema?.groups) return null
  for (const g of schema.groups) for (const f of g.fields || []) if (f.id === fieldId) return f
  return null
}

// ── Main Renderer ─────────────────────────────────────────────────────────────
export default function DynamicRenderer({ sectionNumber, patientId, cycleId, clinicId, assignedSections = [], onSectionSwitch }) {
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  const { sectionData, save, isSaving, syncStatus } = useScreeningSection({ childId: patientId, cycleId, sectionNumber })

  // Auto-save to localStorage
  useEffect(() => {
    if (!patientId || !cycleId || !sectionNumber) return
    const key = `screening_${patientId}_${cycleId}_${sectionNumber}`
    try { localStorage.setItem(key, JSON.stringify({ section_data: formData, is_complete: false, updated_at: new Date().toISOString() })) } catch { }
  }, [formData, patientId, cycleId, sectionNumber])

  useEffect(() => {
    const check = () => {
      try {
        const queue = JSON.parse(localStorage.getItem('screening_sync_queue') || '[]')
        setPendingSyncCount(queue.length)
      } catch {
        setPendingSyncCount(0)
      }
    }

    check()
    window.addEventListener('online', check)
    window.addEventListener('offline', check)
    const interval = window.setInterval(check, 3000)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', check)
      window.removeEventListener('offline', check)
    }
  }, [])

  // Load template
  useEffect(() => {
    if (!clinicId || !cycleId) return
    setLoading(true)
    const cacheKeys = [
      `template_${clinicId}_${cycleId}_${sectionNumber}`,
      `template_${clinicId}_${sectionNumber}`,
    ]

    for (const key of cacheKeys) {
      const cachedTemplate = localStorage.getItem(key)
      if (cachedTemplate) {
        try {
          const cachedSchema = JSON.parse(cachedTemplate)
          if (cachedSchema?.groups) {
            setSchema(cachedSchema)
            if (sectionData) {
              const flat = {}
              for (const g of cachedSchema.groups) for (const f of g.fields || []) flat[f.id] = sectionData[f.id] ?? ''
              setFormData(flat)
            }
            setLoading(false)
            return
          }
        } catch {
          localStorage.removeItem(key)
        }
      }
    }

    supabase.rpc('get_clinic_template', { p_clinic_id: clinicId, p_cycle_id: cycleId, p_section_number: sectionNumber })
      .then(({ data, error }) => {
        if (error || !data?.fieldSchema?.groups) { setSchema(null); return }
        setSchema(data.fieldSchema)
        try {
          localStorage.setItem(`template_${clinicId}_${cycleId}_${sectionNumber}`, JSON.stringify(data.fieldSchema))
          localStorage.setItem(`template_${clinicId}_${sectionNumber}`, JSON.stringify(data.fieldSchema))
        } catch { }
        if (sectionData) {
          const flat = {}
          for (const g of data.fieldSchema.groups) for (const f of g.fields || []) flat[f.id] = sectionData[f.id] ?? ''
          setFormData(flat)
        }
      })
      .catch(() => setSchema(null))
      .finally(() => setLoading(false))
  }, [clinicId, cycleId, sectionNumber])

  // Populate from saved data
  useEffect(() => {
    if (sectionData && schema?.groups) {
      const flat = {}
      for (const g of schema.groups) for (const f of g.fields || []) flat[f.id] = sectionData[f.id] ?? ''
      setFormData(flat)
    }
  }, [sectionData, schema])

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    const field = findFieldById(schema, fieldId)
    if (field) setErrors(prev => ({ ...prev, [fieldId]: validateField(field, value) }))
  }

  const curIdx = assignedSections.indexOf(sectionNumber)
  const hasMulti = assignedSections.length > 1
  const isLast = curIdx === assignedSections.length - 1

  const doSave = () => {
    if (!cycleId || !patientId) return
    try { localStorage.setItem('__storage_test__', '1'); localStorage.removeItem('__storage_test__') }
    catch { window.dispatchEvent(new CustomEvent('storage-full')); return }

    const done = isLast || !hasMulti
    save({ sectionData: { ...formData, updated_at: new Date().toISOString() }, isComplete: done })

    // Only update the patient list cache when the section is truly complete
    if (done) {
      const queueKey = `clinician-queue-${clinicId || 'all'}-${sectionNumber}-${cycleId}`
      try {
        const cached = JSON.parse(localStorage.getItem(queueKey) || 'null')
        if (cached?.patients) {
          const updated = {
            ...cached,
            patients: cached.patients.map(p => {
              if (p.db_id === patientId || p.id === patientId || p.child_id === patientId) {
                return { ...p, section_data: { ...(p.section_data || {}), [`s${sectionNumber}`]: true } }
              }
              return p
            })
          }
          localStorage.setItem(queueKey, JSON.stringify(updated))
        }
      } catch { }
    }

    if (done) window.history.back()
    else onSectionSwitch?.(assignedSections[curIdx + 1])
  }

  if (loading) return <div className="mx-auto max-w-2xl"><FormGroupSkeleton /><FormGroupSkeleton /></div>
  if (!schema) return <EmptyState title="No template found" description="Ask an administrator to activate a template for this section." />

  return (
    <div className="mx-auto max-w-2xl">
      {schema.groups?.map(group => <DynamicFieldGroup key={group.id} group={group} schema={schema} formData={formData} onChange={handleChange} errors={errors} />)}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-center sm:bg-transparent sm:px-0 sm:pt-4">
        <Button onClick={doSave} disabled={isSaving} variant="primary" className="relative w-full sm:w-auto sm:min-w-44">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : isLast || !hasMulti ? 'Save & Finish' : 'Save & Next'}
          {syncStatus === 'pending' && <StatusBadge status="pending">Pending</StatusBadge>}
          {pendingSyncCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-white">
              {pendingSyncCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
