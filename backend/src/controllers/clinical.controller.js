import {
  createMedication,
  createVaccine,
  assignReminderToNurse,
  deleteVaccine as deleteVaccineRecord,
  findMedicationById,
  listActiveNurses,
  listMedicationsForUser,
  listRemindersForUser,
  listVaccinesForUser,
  updateMedication,
  updateReminderStatus,
  updateVaccine,
} from '../repositories/clinical.repository.js'

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const vaccineStates = new Set(['Pendiente', 'Aplicada', 'Atrasada'])

function isValidDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function positiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function listMedications(request, response, next) {
  try {
    return response.json({ data: await listMedicationsForUser(request.user) })
  } catch (error) {
    return next(error)
  }
}

function validateMedicationInput(body = {}) {
  const {
    idPaciente,
    medicamento,
    dosis,
    via,
    frecuencia,
    horarios,
    fechaInicio,
    fechaFin,
    indicaciones,
  } = body
  const errors = []
  if (!positiveId(idPaciente)) errors.push('Seleccioná un paciente válido.')
  if (typeof medicamento !== 'string' || !medicamento.trim() || medicamento.length > 100) {
    errors.push('El nombre del medicamento es obligatorio y no debe superar 100 caracteres.')
  }
  if (typeof dosis !== 'string' || !dosis.trim() || dosis.length > 100) {
    errors.push('La dosis es obligatoria y no debe superar 100 caracteres.')
  }
  if (typeof via !== 'string' || !via.trim() || via.length > 30) errors.push('La vía de administración no es válida.')
  if (typeof frecuencia !== 'string' || !frecuencia.trim() || frecuencia.length > 50) {
    errors.push('La frecuencia no es válida.')
  }
  if (!Array.isArray(horarios) || !horarios.length || horarios.length > 24 ||
      horarios.some((time) => typeof time !== 'string' || !timePattern.test(time)) ||
      new Set(horarios).size !== horarios.length) {
    errors.push('Ingresá horarios válidos, sin repetir.')
  }
  if (!isValidDate(fechaInicio) || (fechaFin && !isValidDate(fechaFin))) {
    errors.push('Las fechas del tratamiento deben ser válidas.')
  }
  if (fechaFin && isValidDate(fechaInicio) && fechaFin < fechaInicio) {
    errors.push('La fecha de finalización no puede ser anterior al inicio.')
  }
  if (fechaFin && isValidDate(fechaInicio) &&
      Date.parse(`${fechaFin}T00:00:00Z`) - Date.parse(`${fechaInicio}T00:00:00Z`) > 365 * 86400000) {
    errors.push('Para este prototipo, cada plan puede abarcar como máximo un año.')
  }
  if (indicaciones !== undefined && (typeof indicaciones !== 'string' || indicaciones.length > 2000)) {
    errors.push('Las indicaciones no deben superar 2000 caracteres.')
  }
  return errors
}

export async function addMedication(request, response, next) {
  const body = request.body ?? {}
  const {
    idPaciente,
    medicamento,
    dosis,
    via,
    frecuencia,
    horarios,
    fechaInicio,
    fechaFin,
    indicaciones,
  } = body

  const errors = validateMedicationInput(body)
  if (errors.length) {
    return response.status(400).json({ error: 'Los datos de medicación no son válidos.', details: errors })
  }
  try {
    const medicationId = await createMedication({
      idPaciente: Number(idPaciente),
      idEnfermero: request.user.id,
      medicamento: medicamento.trim(),
      dosis: dosis.trim(),
      via: via.trim(),
      frecuencia: frecuencia.trim(),
      horarios,
      fechaInicio,
      fechaFin: fechaFin || null,
      indicaciones: indicaciones?.trim() || null,
    })
    return response.status(201).json({ data: await findMedicationById(medicationId) })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return response.status(400).json({ error: 'El paciente seleccionado no existe.' })
    }
    return next(error)
  }
}

export async function editMedication(request, response, next) {
  const body = request.body ?? {}
  const medicationId = positiveId(request.params.medicationId)
  const errors = validateMedicationInput(body)
  if (!medicationId) errors.push('El identificador del plan no es válido.')
  if (typeof body.activa !== 'boolean') errors.push('El estado del plan no es válido.')
  if (errors.length) {
    return response.status(400).json({ error: 'Los datos de medicación no son válidos.', details: errors })
  }

  try {
    const medication = await updateMedication(medicationId, request.user.id, {
      idPaciente: Number(body.idPaciente),
      medicamento: body.medicamento.trim(),
      dosis: body.dosis.trim(),
      via: body.via.trim(),
      frecuencia: body.frecuencia.trim(),
      horarios: body.horarios,
      fechaInicio: body.fechaInicio,
      fechaFin: body.fechaFin || null,
      indicaciones: body.indicaciones?.trim() || null,
      activa: body.activa,
    })
    if (!medication) return response.status(404).json({ error: 'Plan no encontrado o no asignado a esta cuenta.' })
    return response.json({ data: medication })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return response.status(400).json({ error: 'El paciente seleccionado no existe.' })
    }
    return next(error)
  }
}

export async function listReminders(request, response, next) {
  try {
    return response.json({ data: await listRemindersForUser(request.user) })
  } catch (error) {
    return next(error)
  }
}

export async function getNurses(request, response, next) {
  try {
    return response.json({ data: await listActiveNurses() })
  } catch (error) {
    return next(error)
  }
}

export async function assignReminder(request, response, next) {
  const reminderId = positiveId(request.params.reminderId)
  const assignedNurseId = request.body?.idEnfermeroAsignado
  const nurseId = (
    typeof assignedNurseId === 'number' || typeof assignedNurseId === 'string'
  ) ? positiveId(assignedNurseId) : null
  if (!reminderId || !nurseId) {
    return response.status(400).json({ error: 'La asignación del recordatorio no es válida.' })
  }

  try {
    const reminder = await assignReminderToNurse(
      reminderId,
      nurseId,
      request.user,
    )
    if (reminder?.error === 'nurse') {
      return response.status(400).json({ error: 'La enfermera seleccionada no está activa.' })
    }
    if (!reminder) {
      return response.status(404).json({ error: 'Recordatorio pendiente no encontrado o fuera de tu alcance.' })
    }
    return response.json({ data: reminder })
  } catch (error) {
    return next(error)
  }
}

export async function setReminderStatus(request, response, next) {
  const reminderId = positiveId(request.params.reminderId)
  const { estado, observaciones } = request.body ?? {}
  if (!reminderId || !['Administrada', 'Omitida'].includes(estado) ||
      (estado === 'Omitida' && (typeof observaciones !== 'string' || !observaciones.trim()))) {
    return response.status(400).json({
      error: 'Indicá un estado válido y una razón al omitir la dosis.',
    })
  }
  if (observaciones !== undefined && (typeof observaciones !== 'string' || observaciones.length > 500)) {
    return response.status(400).json({ error: 'La observación no debe superar 500 caracteres.' })
  }

  try {
    const reminder = await updateReminderStatus(
      reminderId,
      request.user.id,
      estado,
      observaciones?.trim(),
    )
    if (!reminder) {
      return response.status(409).json({
        error: 'La dosis no existe o ya fue procesada. Actualizá la lista e intentá nuevamente.',
      })
    }
    return response.json({ data: reminder })
  } catch (error) {
    return next(error)
  }
}

function validateVaccine(body = {}) {
  const errors = []
  if (!positiveId(body.idPaciente)) errors.push('Seleccioná un paciente válido.')
  if (typeof body.nombre !== 'string' || !body.nombre.trim() || body.nombre.length > 100) {
    errors.push('El nombre de la vacuna es obligatorio y no debe superar 100 caracteres.')
  }
  if (typeof body.dosis !== 'string' || !body.dosis.trim() || body.dosis.length > 50) {
    errors.push('La dosis es obligatoria y no debe superar 50 caracteres.')
  }
  if (!vaccineStates.has(body.estado)) errors.push('El estado de la vacuna no es válido.')
  if (body.fechaAplicacion && !isValidDate(body.fechaAplicacion)) errors.push('La fecha de aplicación no es válida.')
  if (body.proximaDosis && !isValidDate(body.proximaDosis)) errors.push('La próxima dosis no es válida.')
  if (body.estado === 'Aplicada' && !body.fechaAplicacion) {
    errors.push('Una vacuna aplicada necesita fecha de aplicación.')
  }
  if (body.observaciones !== undefined &&
      (typeof body.observaciones !== 'string' || body.observaciones.length > 500)) {
    errors.push('Las observaciones no deben superar 500 caracteres.')
  }
  return errors
}

export async function listVaccines(request, response, next) {
  try {
    return response.json({ data: await listVaccinesForUser(request.user) })
  } catch (error) {
    return next(error)
  }
}

export async function addVaccine(request, response, next) {
  const body = request.body ?? {}
  const errors = validateVaccine(body)
  if (errors.length) {
    return response.status(400).json({ error: 'Los datos de la vacuna no son válidos.', details: errors })
  }
  try {
    const vaccine = await createVaccine(body, request.user)
    return response.status(201).json({ data: vaccine })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return response.status(400).json({ error: 'El paciente seleccionado no existe.' })
    }
    return next(error)
  }
}

export async function editVaccine(request, response, next) {
  const body = request.body ?? {}
  const vaccineId = positiveId(request.params.vaccineId)
  const errors = validateVaccine(body)
  if (!vaccineId) errors.push('El identificador de la vacuna no es válido.')
  if (errors.length) {
    return response.status(400).json({ error: 'Los datos de la vacuna no son válidos.', details: errors })
  }
  try {
    const vaccine = await updateVaccine(vaccineId, body)
    if (!vaccine) return response.status(404).json({ error: 'Vacuna no encontrada.' })
    return response.json({ data: vaccine })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return response.status(400).json({ error: 'El paciente seleccionado no existe.' })
    }
    return next(error)
  }
}

export async function removeVaccine(request, response, next) {
  const vaccineId = positiveId(request.params.vaccineId)
  if (!vaccineId) {
    return response.status(400).json({ error: 'El identificador de la vacuna no es válido.' })
  }
  try {
    const deleted = await deleteVaccineRecord(vaccineId)
    if (!deleted) return response.status(404).json({ error: 'Vacuna no encontrada.' })
    return response.status(204).end()
  } catch (error) {
    return next(error)
  }
}
