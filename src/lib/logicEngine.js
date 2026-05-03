/**
 * LOGIC ENGINE
 * Handles conditional visibility, computed fields, and validation
 * Used by both FormBuilder preview and ClinicianScreeningForm dynamic mode
 */

export function isFieldVisible(fieldConfig, formData) {
  if (!fieldConfig.conditions?.length) return true
  return fieldConfig.conditions.every(cond => {
    const fieldValue = formData[cond.field]
    switch (cond.op) {
      case 'equals': return String(fieldValue ?? '') === String(cond.value ?? '')
      case 'notEquals': return String(fieldValue ?? '') !== String(cond.value ?? '')
      case 'contains': return String(fieldValue || '').includes(cond.value)
      case 'notContains': return !String(fieldValue || '').includes(cond.value)
      case 'greaterThan': return Number(fieldValue) > Number(cond.value)
      case 'lessThan': return Number(fieldValue) < Number(cond.value)
      case 'greaterThanOrEqual': return Number(fieldValue) >= Number(cond.value)
      case 'lessThanOrEqual': return Number(fieldValue) <= Number(cond.value)
      case 'isEmpty': return !fieldValue || fieldValue === ''
      case 'isNotEmpty': return fieldValue && fieldValue !== ''
      default: return true
    }
  })
}

export function calculateField(groupsSchema, fieldId, formData) {
  const field = findFieldById(groupsSchema, fieldId)
  if (!field || field.type !== 'computed' || !field.formula) return null

  try {
    const result = evaluateFormula(field.formula, formData, groupsSchema)
    return isFinite(result) ? Number(result.toFixed(2)) : null

  } catch (e) {
    // console.warn(`Formula error for field ${fieldId}:`, e.message)
    return null
  }
}

function findFieldById(groups, fieldId) {
  for (const group of groups || []) {
    const field = (group.fields || []).find(f => f.id === fieldId)
    if (field) return field
  }
  return null
}

function evaluateFormula(formula, formData, groups) {
  const variables = {}
  for (const group of groups || []) {
    for (const field of group.fields || []) {
      const val = formData[field.id]
      // If value is truly empty, skip this variable entirely
      if (val === undefined || val === '' || val === null) {
        // Only add to variables if it has a value
        continue
      }
      const varName = (field.label || '').replace(/\s*\([^)]*\)\s*/g, '').trim().replace(/\s+/g, '_')
      if (varName) variables[varName] = Number(val)
    }
  }
  const keys = Object.keys(variables)
  const vals = Object.values(variables)
  if (keys.length === 0) return NaN
  return (new Function(...keys, `return (${formula})`))(...vals)
}

export function validateField(fieldConfig, value) {
  const errors = []

  if (fieldConfig.required && (value === undefined || value === '' || value === null)) {
    errors.push('This field is required')
  }

  if (fieldConfig.type === 'number') {
    const num = Number(value)
    if (!isNaN(num)) {
      if (fieldConfig.min !== undefined && fieldConfig.min !== '' && num < Number(fieldConfig.min)) {
        errors.push(`Minimum value is ${fieldConfig.min}`)
      }
      if (fieldConfig.max !== undefined && fieldConfig.max !== '' && num > Number(fieldConfig.max)) {
        errors.push(`Maximum value is ${fieldConfig.max}`)
      }
    }
  }

  if ((fieldConfig.type === 'dropdown' || fieldConfig.type === 'radio') && fieldConfig.options?.length) {
    const validValues = fieldConfig.options.map(o => o.v)
    if (value && !validValues.includes(value)) {
      errors.push('Invalid option selected')
    }
  }

  return errors
}

export function transformGroupsToSchema(groups) {
  const schema = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    groups: [],
    logic: [],
    computed: [],
  }

  for (const group of groups) {
    const groupSchema = {
      id: group.id,
      label: group.label,
      color: group.color,
      fields: [],
    }

    for (const field of group.fields || []) {
      const fieldSchema = {
        id: field.id,
        type: field.type,
        label: field.label,
        required: field.required || false,
        help: field.help || '',
        ...(field.step && { step: field.step }),
        ...(field.min && { min: field.min }),
        ...(field.max && { max: field.max }),
        ...(field.options?.length && { options: field.options }),
        ...(field.presets?.length && { presets: field.presets }),
        ...(field.formula && { formula: field.formula }),
        ...(field.conditions?.length && { conditions: field.conditions }),
      }

      groupSchema.fields.push(fieldSchema)

      if (field.type === 'computed') {
        schema.computed.push({
          id: field.id,
          formula: field.formula,
          dependsOn: extractDependencies(field.formula, groups),
        })
      }

      if (field.conditions?.length) {
        for (const cond of field.conditions) {
          if (!schema.logic.find(l => l.field === field.id && l.condition === cond)) {
            schema.logic.push({
              field: field.id,
              condition: cond,
            })
          }
        }
      }
    }

    schema.groups.push(groupSchema)
  }

  return schema
}

export function transformSchemaToGroups(schema, existingIdMap = {}) {
  if (!schema?.groups) return []

  const groups = []
  let idCounter = 200

  const getId = (prefix) => {
    if (existingIdMap[prefix]) return existingIdMap[prefix]
    return `${prefix}${idCounter++}`
  }

  for (const group of schema.groups) {
    groups.push({
      id: getId(group.id || 'g'),
      label: group.label,
      color: group.color,
      fields: (group.fields || []).map(field => ({
        id: getId(field.id || 'f'),
        type: field.type,
        label: field.label,
        required: field.required || false,
        help: field.help || '',
        step: field.step || '',
        min: field.min || '',
        max: field.max || '',
        options: field.options || [],
        presets: field.presets || [],
        formula: field.formula || '',
        conditions: field.conditions || [],
      })),
    })
  }

  return groups
}

function extractDependencies(formula, groups) {
  const deps = []
  const formulaLower = formula.toLowerCase()

  for (const group of groups || []) {
    for (const field of group.fields || []) {
      const labelKey = (field.label || '')
        .replace(/\s*\([^)]*\)\s*/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()

      if (formulaLower.includes(labelKey)) {
        deps.push(field.id)
      }
    }
  }

  return deps
}

export function flattenSchemaToFormData(schema) {
  const formData = {}

  for (const group of schema.groups || []) {
    for (const field of group.fields || []) {
      formData[field.id] = ''
    }
  }

  return formData
}

export function dryRunSchema(schema) {
  const groups = schema?.groups || []
  const errors = []
  const fieldIds = new Set()
  const sampleData = {}

  for (const group of groups) {
    for (const field of group.fields || []) {
      if (!field?.id) {
        errors.push('A field is missing its id.')
        continue
      }

      if (fieldIds.has(field.id)) {
        errors.push(`Duplicate field id: ${field.id}`)
        continue
      }

      fieldIds.add(field.id)
      sampleData[field.id] = ''
    }
  }

  for (const group of groups) {
    for (const field of group.fields || []) {
      for (const condition of field.conditions || []) {
        if (condition.field && !fieldIds.has(condition.field)) {
          errors.push(`Field "${field.label || field.id}" references missing condition field "${condition.field}".`)
        }
      }

      try {
        isFieldVisible(field, sampleData)
        validateField(field, sampleData[field.id] ?? '')
      } catch (error) {
        errors.push(`Field "${field.label || field.id}" failed dry-run validation: ${error.message}`)
      }

      if (field.type === 'computed' && field.formula) {
        try {
          evaluateFormula(field.formula, sampleData, groups)
        } catch (error) {
          errors.push(`Computed field "${field.label || field.id}" has an invalid formula.`)
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
