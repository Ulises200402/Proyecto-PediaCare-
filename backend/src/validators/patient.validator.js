const allowedSexValues = new Set([
  'Femenino',
  'Masculino',
  'Otro',
  'No especificado',
])

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsedDate.valueOf())
    && parsedDate.toISOString().slice(0, 10) === value
    && value <= new Date().toISOString().slice(0, 10)
}

function isOptionalText(value) {
  return value === undefined || value === null || typeof value === 'string'
}

function isPositiveId(value) {
  return Number.isSafeInteger(value) && value > 0
}

export function validateNewPatient(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['El cuerpo debe ser un objeto JSON.'] }
  }

  const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : ''
  const idTutor1 = Number(body.idTutor1)
  const idTutor2 = body.idTutor2 == null || body.idTutor2 === ''
    ? null
    : Number(body.idTutor2)
  const errors = []

  if (!nombre || nombre.length > 100) {
    errors.push('nombre es obligatorio y admite hasta 100 caracteres.')
  }
  if (!isValidDate(body.fechaNacimiento)) {
    errors.push('fechaNacimiento debe ser una fecha válida, no futura, con formato AAAA-MM-DD.')
  }
  if (!allowedSexValues.has(body.sexo)) {
    errors.push('sexo no corresponde con los valores permitidos.')
  }
  if (!isPositiveId(idTutor1)) {
    errors.push('idTutor1 debe ser un identificador positivo.')
  }
  if (idTutor2 !== null && !isPositiveId(idTutor2)) {
    errors.push('idTutor2 debe ser un identificador positivo o null.')
  }
  if (idTutor2 !== null && idTutor1 === idTutor2) {
    errors.push('Los dos tutores deben ser personas distintas.')
  }
  if (!isOptionalText(body.alergias) || (body.alergias?.length ?? 0) > 65535) {
    errors.push('alergias debe ser texto de hasta 65535 caracteres.')
  }
  if (!isOptionalText(body.enfermedadesCronicas)
      || (body.enfermedadesCronicas?.length ?? 0) > 65535) {
    errors.push('enfermedadesCronicas debe ser texto de hasta 65535 caracteres.')
  }

  if (errors.length > 0) return { errors }

  return {
    value: {
      nombre,
      fechaNacimiento: body.fechaNacimiento,
      sexo: body.sexo,
      alergias: body.alergias?.trim() || null,
      enfermedadesCronicas: body.enfermedadesCronicas?.trim() || null,
      idTutor1,
      idTutor2,
    },
  }
}