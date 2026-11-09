export function normalizeDni(value) {
  return typeof value === 'string' ? value.trim().replace(/[.\s]/g, '') : ''
}

export function isValidDni(value) {
  return /^\d{7,8}$/.test(value)
}
