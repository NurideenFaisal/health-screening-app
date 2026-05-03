const SMALL_WORDS = new Set(['and', 'or', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'a', 'an'])

export function toTitleCase(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && SMALL_WORDS.has(word)) return word
      return word
        .split('-')
        .map(part => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
        .join('-')
    })
    .join(' ')
}

export function toSentenceCase(value = '') {
  const text = String(value).trim().replace(/\s+/g, ' ')
  if (!text) return ''
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`
}

export function toUpperLabel(value = '') {
  return String(value).trim().toUpperCase()
}

export function formatPatientName(firstName, lastName) {
  return toTitleCase([firstName, lastName].filter(Boolean).join(' '))
}

export function formatCommunity(value) {
  return toTitleCase(value)
}
