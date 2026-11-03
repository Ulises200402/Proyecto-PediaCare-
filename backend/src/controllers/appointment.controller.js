import {
  cancelFamilyAppointment,
  createAppointmentRequest,
  findAppointmentsForUser,
  listAvailableDoctors,
  updateAppointmentStatus,
} from '../repositories/appointment.repository.js'

const validStates = new Set(['Programado', 'Confirmado', 'Atendido', 'Ausente', 'Cancelado'])

function isPositiveId(value) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0
}

export async function listAppointments(request, response, next) {
  try {
    const appointments = await findAppointmentsForUser(request.user)
    return response.json({ data: appointments })
  } catch (error) {
    return next(error)
  }
}

export async function listDoctors(_request, response, next) {
  try {
    return response.json({ data: await listAvailableDoctors() })
  } catch (error) {
    return next(error)
  }
}

export async function requestAppointment(request, response, next) {
  const { idPaciente, idMedico, fechaHora, motivo } = request.body ?? {}
  const match = typeof fechaHora === 'string'
    ? /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)$/.exec(fechaHora)
    : null
  const dateValue = match ? new Date(`${match[1]}T00:00:00Z`) : null
  const dateIsValid = dateValue && !Number.isNaN(dateValue.valueOf()) &&
    dateValue.toISOString().slice(0, 10) === match[1]
  if (!isPositiveId(idPaciente) || !isPositiveId(idMedico) || !dateIsValid ||
      new Date(fechaHora) <= new Date() ||
      typeof motivo !== 'string' || !motivo.trim() || motivo.trim().length > 255) {
    return response.status(400).json({
      error: 'Ingresá paciente, profesional, fecha futura y motivo válidos.',
    })
  }

  try {
    const result = await createAppointmentRequest({
      idPaciente: Number(idPaciente),
      idMedico: Number(idMedico),
      fechaHora: `${match[1]} ${match[2]}:00`,
      motivo: motivo.trim(),
    }, request.user)
    if (result.error === 'doctor') {
      return response.status(400).json({ error: 'El profesional seleccionado no está disponible.' })
    }
    if (result.error === 'patient') {
      return response.status(404).json({ error: 'Paciente no encontrado o no asociado a tu cuenta.' })
    }
    if (result.error === 'conflict') {
      return response.status(409).json({ error: 'Ese horario ya está solicitado. Elegí otro horario.' })
    }
    return response.status(201).json({ data: result.data })
  } catch (error) {
    return next(error)
  }
}

export async function patchAppointmentStatus(request, response, next) {
  const appointmentId = Number(request.params.appointmentId)
  const { estado } = request.body ?? {}

  if (!isPositiveId(appointmentId) || !validStates.has(estado)) {
    return response.status(400).json({ error: 'Estado de turno no válido.' })
  }

  try {
    const appointment = await updateAppointmentStatus(appointmentId, estado, request.user)
    if (appointment?.error === 'transition') {
      return response.status(409).json({ error: 'El turno no puede cambiar a ese estado desde su estado actual.' })
    }
    if (!appointment) return response.status(404).json({ error: 'Turno no encontrado.' })
    return response.json({ data: appointment })
  } catch (error) {
    return next(error)
  }
}

export async function cancelAppointment(request, response, next) {
  const appointmentId = Number(request.params.appointmentId)
  if (!isPositiveId(appointmentId)) {
    return response.status(400).json({ error: 'El identificador del turno no es válido.' })
  }
  try {
    const appointment = await cancelFamilyAppointment(appointmentId, request.user)
    if (!appointment) {
      return response.status(404).json({ error: 'Turno no encontrado o ya no se puede cancelar.' })
    }
    return response.json({ data: appointment })
  } catch (error) {
    return next(error)
  }
}
