import {
  findAppointmentsForUser,
  updateAppointmentStatus,
} from '../repositories/appointment.repository.js'

export async function listAppointments(request, response, next) {
  try {
    const appointments = await findAppointmentsForUser(request.user)
    return response.json({ data: appointments })
  } catch (error) {
    return next(error)
  }
}

export async function patchAppointmentStatus(request, response, next) {
  const appointmentId = Number(request.params.appointmentId)
  const { estado } = request.body

  if (!['Programado', 'Confirmado', 'Atendido', 'Ausente', 'Cancelado'].includes(estado)) {
    return response.status(400).json({ error: 'Estado de turno no válido.' })
  }

  try {
    const appointment = await updateAppointmentStatus(appointmentId, estado)
    if (!appointment) return response.status(404).json({ error: 'Turno no encontrado.' })
    return response.json({ data: appointment })
  } catch (error) {
    return next(error)
  }
}
