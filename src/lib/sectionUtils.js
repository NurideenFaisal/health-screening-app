export function getProfileSectionNumber(profile) {
  const sections = profile?.assigned_sections
  if (Array.isArray(sections) && sections.length > 0) {
    const parsed = Number.parseInt(String(sections[0]), 10)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }
  return null
}

export function normalizeSectionOrder(sectionOrder, fallbackSectionNumber = null) {
  let parsedOrder = sectionOrder

  if (typeof sectionOrder === 'string') {
    try {
      parsedOrder = JSON.parse(sectionOrder)
    } catch {
      parsedOrder = sectionOrder
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
    }
  }

  const normalized = Array.isArray(parsedOrder)
    ? parsedOrder
        .map(value => Number.parseInt(value, 10))
        .filter(value => Number.isInteger(value) && value > 0)
    : []

  if (normalized.length > 0) {
    return Array.from(new Set(normalized))
  }

  if (fallbackSectionNumber) {
    return [fallbackSectionNumber]
  }

  return []
}

export function getSectionColorClasses(color) {
  const palette = {
    violet: {
      badge: 'bg-violet-500 text-white',
      badgeLight: 'bg-violet-100 text-violet-700',
      dot: 'bg-violet-400',
    },
    sky: {
      badge: 'bg-sky-500 text-white',
      badgeLight: 'bg-sky-100 text-sky-700',
      dot: 'bg-sky-400',
    },
    amber: {
      badge: 'bg-amber-500 text-white',
      badgeLight: 'bg-amber-100 text-amber-700',
      dot: 'bg-amber-400',
    },
    pink: {
      badge: 'bg-pink-500 text-white',
      badgeLight: 'bg-pink-100 text-pink-700',
      dot: 'bg-pink-400',
    },
    emerald: {
      badge: 'bg-emerald-500 text-white',
      badgeLight: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-400',
    },
    red: {
      badge: 'bg-red-500 text-white',
      badgeLight: 'bg-red-100 text-red-700',
      dot: 'bg-red-400',
    },
    slate: {
      badge: 'bg-slate-500 text-white',
      badgeLight: 'bg-slate-100 text-slate-700',
      dot: 'bg-slate-400',
    },
  }

  return palette[color] || {
    badge: 'bg-slate-500 text-white',
    badgeLight: 'bg-slate-100 text-slate-700',
    dot: 'bg-slate-400',
  }
}
