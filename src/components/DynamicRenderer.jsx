import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useScreeningSection } from '../hooks/useScreeningSection'
import { calculateField, isFieldVisible, validateField } from '../lib/logicEngine'
import { Button, EmptyState, Skeleton, StatusBadge } from './ui/primitives'

const controlClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

const RadioGroup = ({ options = [], value, onChange }) => (
  <div className="mt-2 flex flex-wrap gap-2">
    {options.map(option => (
      <button
        key={option.v}
        type="button"
        onClick={() => onChange(option.v)}
        className={`min-h-11 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition active:scale-[0.97] ${value === option.v ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'}`}
      >
        {option.l || option.v}
      </button>
    ))}
  </div>
)

const TextInput = ({ type = 'text', value, onChange, placeholder, step, min, max }) => (
  <input type={type} value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder || 'Enter value'} step={step} min={min} max={max} className={controlClass} />
)

const SelectInput = ({ options = [], value, onChange, placeholder }) => (
  <select value={value || ''} onChange={event => onChange(event.target.value)} className={controlClass}>
    <option value="">{placeholder || 'Select...'}</option>
    {options.map(option => <option key={option.v} value={option.v}>{option.l || option.v}</option>)}
  </select>
)

const CheckboxInput = ({ label, checked, onChange }) => (
  <label className="mt-1.5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition hover:bg-slate-50">
    <input type="checkbox" checked={!!checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
    <span className="text-sm font-medium text-slate-700">{label}</span>
  </label>
)

const TextAreaInput = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value || ''} onChange={event => onChange(event.target.value)} placeholder={placeholder || 'Enter details'} rows={rows} className={`${controlClass} resize-none`} />
)

const FieldLabel = ({ label, required }) => (
  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
    {label || 'Untitled'}{required && <span className="ml-0.5 text-rose-500">*</span>}
  </label>
)

function DynamicFieldGroup({ group, schema, formData, onChange, errors }) {
  const color = group.color || '#059669'
  return (
    <section className="mb-5 rounded-2xl border p-4 shadow-sm sm:p-5" style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}>
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {group.label || 'Section'}
      </h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {(group.fields || []).map(field => <DynamicField key={field.id} field={field} schema={schema} formData={formData} onChange={onChange} errors={errors} />)}
      </div>
    </section>
  )
}

function FormGroupSkeleton() {
  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-2.5 w-2.5 rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="mb-2 h-3 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div>
          <Skeleton className="mb-2 h-3 w-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </section>
  )
}

function DynamicField({ field, schema, formData, onChange, errors }) {
  if (!isFieldVisible(field, formData)) return null

  const value = formData[field.id] ?? ''
  const fieldErrors = errors?.[field.id] || []
  const handleChange = nextValue => onChange(field.id, nextValue)

  if (field.type === 'computed') {
    const computedValue = calculateField(schema?.groups, field.id, formData)
    return (
      <div>
        <FieldLabel label={field.label} required={field.required} />
        <div className="mt-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 font-mono text-sm text-violet-700">
          {computedValue !== null ? computedValue : '(auto)'}
        </div>
        {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
      </div>
    )
  }

  return (
    <div>
      {field.type === 'checkbox' ? (
        <CheckboxInput label={field.label} checked={value} onChange={handleChange} />
      ) : field.type === 'radio' ? (
        <div><FieldLabel label={field.label} required={field.required} /><RadioGroup options={field.options} value={value} onChange={handleChange} /></div>
      ) : field.type === 'dropdown' || field.type === 'select' ? (
        <div><FieldLabel label={field.label} required={field.required} /><SelectInput options={field.options} value={value} onChange={handleChange} placeholder="Select..." /></div>
      ) : field.type === 'textarea' ? (
        <div><FieldLabel label={field.label} required={field.required} /><TextAreaInput value={value} onChange={handleChange} placeholder={field.help} rows={field.display?.rows || 3} /></div>
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
  for (const group of schema.groups) {
    const field = (group.fields || []).find(item => item.id === fieldId)
    if (field) return field
  }
  return null
}

export default function DynamicRenderer({ sectionNumber, patientId, cycleId, clinicId, assignedSections = [], onSectionSwitch }) {
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const { sectionData, save, isSaving, syncStatus } = useScreeningSection({ childId: patientId, cycleId, sectionNumber })

  useEffect(() => {
    if (!patientId || !cycleId || !sectionNumber) return
    const key = `screening_${patientId}_${cycleId}_${sectionNumber}`
    try {
      localStorage.setItem(key, JSON.stringify({ section_data: formData, is_complete: false, updated_at: new Date().toISOString() }))
    } catch {
      // Continue without local autosave when storage is unavailable.
    }
  }, [formData, patientId, cycleId, sectionNumber])

  useEffect(() => {
    if (!clinicId || !cycleId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    supabase.rpc('get_clinic_template', { p_clinic_id: clinicId, p_cycle_id: cycleId, p_section_number: sectionNumber })
      .then(({ data, error }) => {
        if (error || !data?.fieldSchema?.groups) {
          setSchema(null)
          return
        }
        setSchema(data.fieldSchema)
        if (sectionData) {
          const flat = {}
          for (const group of data.fieldSchema.groups) for (const field of group.fields || []) flat[field.id] = sectionData[field.id] ?? ''
          setFormData(flat)
        }
      })
      .catch(error => {
        console.error('Template error:', error)
        setSchema(null)
      })
      .finally(() => setLoading(false))
  }, [clinicId, cycleId, sectionNumber, sectionData])

  useEffect(() => {
    if (sectionData && schema?.groups) {
      const flat = {}
      for (const group of schema.groups) for (const field of group.fields || []) flat[field.id] = sectionData[field.id] ?? ''
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(flat)
    }
  }, [sectionData, schema])

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    const field = findFieldById(schema, fieldId)
    if (field) setErrors(prev => ({ ...prev, [fieldId]: validateField(field, value) }))
  }

  const currentIndex = assignedSections.indexOf(sectionNumber)
  const hasMultipleSections = assignedSections.length > 1
  const isLast = currentIndex === assignedSections.length - 1

  const doSave = () => {
    if (!cycleId || !patientId) return
    const shouldComplete = isLast || !hasMultipleSections
    save({ sectionData: { ...formData, updated_at: new Date().toISOString() }, isComplete: shouldComplete })
    if (shouldComplete) window.history.back()
    else onSectionSwitch?.(assignedSections[currentIndex + 1])
  }

  if (loading) return (
    <div>
      <FormGroupSkeleton />
      <FormGroupSkeleton />
    </div>
  )
  if (!schema) return <EmptyState title="No template found" description="Ask an administrator to activate a template for this section." />

  return (
    <div>
      {schema.groups?.map(group => <DynamicFieldGroup key={group.id} group={group} schema={schema} formData={formData} onChange={handleChange} errors={errors} />)}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-center sm:bg-transparent sm:px-0 sm:pt-4 sm:backdrop-blur-0">
        <Button onClick={doSave} disabled={isSaving} variant="primary" className="w-full sm:w-auto sm:min-w-44">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : isLast || !hasMultipleSections ? 'Save & Finish' : 'Save & Next'}
          {syncStatus === 'pending' && <StatusBadge status="pending">Pending</StatusBadge>}
        </Button>
      </div>
    </div>
  )
}
