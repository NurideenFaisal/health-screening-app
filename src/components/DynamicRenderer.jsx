import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useScreeningSection } from '../hooks/useScreeningSection'
import { isFieldVisible, calculateField, validateField } from '../lib/logicEngine'

const RadioGroup = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {options?.map(opt => (
      <button
        key={opt.v}
        type="button"
        onClick={() => onChange(opt.v)}
        className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          value === opt.v
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
        }`}
      >
        {opt.l || opt.v}
      </button>
    ))}
  </div>
)

const TextInput = ({ type = 'text', value, onChange, placeholder, step, min, max }) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder || 'Enter value'}
    step={step}
    min={min}
    max={max}
    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
  />
)

const SelectInput = ({ options, value, onChange, placeholder }) => (
  <select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
  >
    <option value="">{placeholder || 'Select...'}</option>
    {options?.map(opt => (
      <option key={opt.v} value={opt.v}>{opt.l || opt.v}</option>
    ))}
  </select>
)

const CheckboxInput = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 mt-1 cursor-pointer">
    <input
      type="checkbox"
      checked={!!checked}
      onChange={e => onChange(e.target.checked)}
      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
)

const TextAreaInput = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder || 'Enter details'}
    rows={rows}
    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none resize-none"
  />
)

const FieldLabel = ({ label, required }) => (
  <label className="block text-xs font-semibold text-gray-700 mb-0.5">
    <span className="text-emerald-600 mr-1">•</span>{label}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
)

const SectionHeader = ({ color, title }) => {
  const colorMap = {
    violet: 'bg-violet-500', sky: 'bg-sky-500', amber: 'bg-amber-500',
    pink: 'bg-pink-500', emerald: 'bg-emerald-500', red: 'bg-red-500',
  }
  return (
    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colorMap[color] || 'bg-gray-500'}`}></span>
      {title}
    </h3>
  )
}

function DynamicFieldGroup({ group, schema, formData, onChange, errors }) {
  return (
    <div className="mb-6">
      <SectionHeader color={group.color} title={group.label} />
      <div className="space-y-4">
        {group.fields.map(field => (
          <DynamicField 
            key={field.id} 
            field={field} 
            schema={schema}
            formData={formData}
            onChange={onChange}
            errors={errors}
          />
        ))}
      </div>
    </div>
  )
}

function DynamicField({ field, schema, formData, onChange, errors }) {
  const visible = isFieldVisible(field, formData)
  
  if (!visible) return null
  
  const value = formData[field.id] ?? ''
  const fieldErrors = errors?.[field.id] || []
  const handleChange = val => onChange(field.id, val)
  
  if (field.type === 'computed') {
    const computedValue = calculateField(schema?.groups, field.id, formData)
    return (
      <div>
        <FieldLabel label={field.label} required={field.required} />
        <div className="mt-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-mono text-purple-700">
          {computedValue !== null ? computedValue : '(auto)'}
        </div>
        {field.help && <p className="text-[11px] text-gray-400 mt-0.5">{field.help}</p>}
      </div>
    )
  }
  
  return (
    <div>
      {field.type === 'checkbox' ? (
        <CheckboxInput
          label={field.label}
          checked={value}
          onChange={handleChange}
        />
      ) : field.type === 'radio' ? (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <RadioGroup
            options={field.options}
            value={value}
            onChange={handleChange}
          />
        </div>
      ) : field.type === 'dropdown' || field.type === 'select' ? (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <SelectInput
            options={field.options}
            value={value}
            onChange={handleChange}
            placeholder="Select..."
          />
        </div>
      ) : field.type === 'textarea' ? (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <TextAreaInput
            value={value}
            onChange={handleChange}
            placeholder={field.help}
            rows={field.display?.rows || 3}
          />
        </div>
      ) : (
        <div>
          <FieldLabel label={field.label} required={field.required} />
          <TextInput
            type={field.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={handleChange}
            placeholder={field.help}
            step={field.step}
            min={field.min}
            max={field.max}
          />
        </div>
      )}
      {field.help && !['checkbox', 'radio', 'dropdown', 'select', 'textarea'].includes(field.type) && (
        <p className="text-[11px] text-gray-400 mt-0.5">{field.help}</p>
      )}
      {fieldErrors.length > 0 && (
        <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors[0]}</p>
      )}
    </div>
  )
}

function findFieldById(schema, fieldId) {
  if (!schema?.groups) return null
  for (const group of schema.groups) {
    const field = group.fields.find(f => f.id === fieldId)
    if (field) return field
  }
  return null
}

export default function DynamicRenderer({ sectionNumber }) {
  const { patientId, cycleId, clinicId } = useOutletContext()
  const [schema, setSchema] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  
  const { sectionData, isComplete, save, isSaving } = useScreeningSection({
    patientId,
    cycleId,
    sectionNumber,
  })
  
  useEffect(() => {
    async function loadTemplate() {
      if (!clinicId || !cycleId) return
      try {
        const { data, error } = await supabase.rpc('get_clinic_template', {
          p_clinic_id: clinicId,
          p_cycle_id: cycleId,
          p_section_number: sectionNumber,
        })
        
        if (error) throw error
        
        if (data?.fieldSchema?.groups) {
          setSchema(data.fieldSchema)
        }
      } catch (err) {
        console.error('Error loading template:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadTemplate()
  }, [clinicId, cycleId])
  
  useEffect(() => {
    if (sectionData) {
      const flatData = {}
      if (schema?.groups) {
        for (const group of schema.groups) {
          for (const field of group.fields) {
            flatData[field.id] = sectionData[field.id] ?? ''
          }
        }
      }
      setFormData(flatData)
    }
  }, [sectionData, schema])
  
  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    
    const field = findFieldById(schema, fieldId)
    if (field) {
      const fieldErrors = validateField(field, value)
      setErrors(prev => ({
        ...prev,
        [fieldId]: fieldErrors,
      }))
    }
  }
  
  const handleSave = async () => {
    if (!cycleId || !patientId) return
    
    const payload = {
      ...formData,
      updated_at: new Date().toISOString(),
    }
    
    await save({ sectionData: payload })
  }
  
  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader className="h-5 w-5 animate-spin text-emerald-600" />
          Loading template...
        </div>
      </div>
    )
  }
  
  if (!schema) {
    return (
      <div className="text-center py-8 text-gray-500">
        No template found for this section
      </div>
    )
  }
  
  return (
    <div>
      {schema.groups?.map(group => (
        <DynamicFieldGroup
          key={group.id}
          group={group}
          schema={schema}
          formData={formData}
          onChange={handleChange}
          errors={errors}
        />
      ))}
      
      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
