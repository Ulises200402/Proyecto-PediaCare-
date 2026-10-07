const registrationRoles = new Set(['PADRE_MADRE', 'MEDICO', 'ENFERMERO'])
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['El cuerpo debe ser un objeto JSON.'] }
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const role = typeof body.role === 'string' ? body.role : ''
  const errors = []

  if (!nombre || nombre.length > 100) errors.push('nombre es obligatorio y admite hasta 100 caracteres.')
  if (!emailPattern.test(email) || email.length > 254) errors.push('email no es válido.')
  const passwordLength = Buffer.byteLength(password, 'utf8')
  if (passwordLength < 12 || passwordLength > 72) {
    errors.push('La contraseña debe tener entre 12 y 72 bytes.')
  }
  if (!registrationRoles.has(role)) errors.push('role debe ser PADRE_MADRE, MEDICO o ENFERMERO.')

  const value = { nombre, email, password, role }

  if (role === 'PADRE_MADRE') {
    const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : ''
    if (telefono.length > 25) errors.push('telefono admite hasta 25 caracteres.')
    value.telefono = telefono || null
  }

  if (role === 'MEDICO' || role === 'ENFERMERO') {
    const matricula = typeof body.matricula === 'string' ? body.matricula.trim() : ''
    const registrationCode = typeof body.registrationCode === 'string'
      ? body.registrationCode
      : ''

    if (!matricula || matricula.length > 30) {
      errors.push('matricula es obligatoria y admite hasta 30 caracteres.')
    }
    if (!registrationCode) errors.push('registrationCode es obligatorio para perfiles clínicos.')
    value.matricula = matricula
    value.registrationCode = registrationCode

    if (role === 'MEDICO') {
      const especialidad = typeof body.especialidad === 'string'
        ? body.especialidad.trim()
        : ''
      if (!especialidad || especialidad.length > 80) {
        errors.push('especialidad es obligatoria y admite hasta 80 caracteres.')
      }
      value.especialidad = especialidad
    }
  }

  return errors.length > 0 ? { errors } : { value }
}