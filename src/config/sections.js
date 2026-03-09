/**
 * SECTIONS CONFIGURATION
 * 
 * This is the central configuration for all screening sections.
 * To add more sections:
 * 1. Add a new entry to this array with a unique value
 * 2. Add the lazy import in App.jsx LAZY_SECTIONS map
 * 3. Database tables already support sections 1-10 (screening_sections table)
 * 
 * The app will dynamically generate:
 * - Section pills in patient list
 * - Status calculations
 * - Navigation routes (auto-generated from LAZY_SECTIONS in App.jsx)
 * - Admin role management dropdowns
 */

export const SECTIONS = [
  {
    value: '1',
    label: 'Section 1',
    shortLabel: 'S1',
    title: 'Vitals & Development',
    color: 'violet',
    doneColor: 'bg-violet-400',
    // Tabs specific to Section 1
    tabs: [
      { label: 'Vitals', path: '.' },
      { label: 'Immunization', path: 'immunization' },
      { label: 'Development', path: 'development' },
    ],
  },
  {
    value: '2',
    label: 'Section 2',
    shortLabel: 'S2',
    title: 'Laboratory',
    color: 'sky',
    doneColor: 'bg-sky-400',
    tabs: [], // Section 2 has no sub-tabs (single page)
  },
  {
    value: '3',
    label: 'Section 3',
    shortLabel: 'S3',
    title: 'Diagnosis',
    color: 'amber',
    doneColor: 'bg-amber-400',
    tabs: [], // Section 3 has no sub-tabs (single page)
  },
  {
    value: '4',
    label: 'Section 4',
    shortLabel: 'S4',
    title: 'Dental/Other',
    color: 'pink',
    doneColor: 'bg-pink-400',
    tabs: [], // Section 4 has no sub-tabs (single page)
  },
  // Additional sections can be added here following the same pattern
]

// Color mappings for pills and badges
export const SECTION_COLORS = {
  violet: {
    bg: 'bg-violet-400',
    bgLight: 'bg-violet-100',
    text: 'text-violet-600',
    border: 'border-violet-200',
  },
  sky: {
    bg: 'bg-sky-400',
    bgLight: 'bg-sky-100',
    text: 'text-sky-600',
    border: 'border-sky-200',
  },
  amber: {
    bg: 'bg-amber-400',
    bgLight: 'bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-200',
  },
  pink: {
    bg: 'bg-pink-400',
    bgLight: 'bg-pink-100',
    text: 'text-pink-600',
    border: 'border-pink-200',
  },
  emerald: {
    bg: 'bg-emerald-400',
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
}

// Helper functions
export const getSectionByValue = (value) => {
  return SECTIONS.find(s => s.value === String(value)) || SECTIONS[0]
}

export const getSectionLabel = (value) => {
  const section = getSectionByValue(value)
  return section?.label || `Section ${value}`
}

export const getSectionTitle = (value) => {
  const section = getSectionByValue(value)
  return section?.title || section?.label || `Section ${value}`
}

export const getSectionPills = () => {
  return SECTIONS.map(s => ({
    key: `s${s.value}`,
    label: s.shortLabel,
    doneColor: s.doneColor,
    title: s.title,
  }))
}

// Database column mapping
export const getSectionColumn = (sectionValue) => {
  return `section${sectionValue}_complete`
}

export const getAllSectionColumns = () => {
  return SECTIONS.map(s => getSectionColumn(s.value))
}

// Check if all sections are complete
export const areAllSectionsComplete = (sectionsObj) => {
  if (!sectionsObj) return false
  return SECTIONS.every(s => sectionsObj[`s${s.value}`] === true)
}

// Get completion status for a specific section
export const getSectionStatus = (sectionsObj, sectionValue) => {
  if (!sectionsObj) return false
  return sectionsObj[`s${sectionValue}`] === true
}

// Legacy exports for backward compatibility
export const SECTION_LABELS = Object.fromEntries(
  SECTIONS.map(s => [s.value, s.title])
)

export const SECTION_PILLS = getSectionPills()
