import {
  createConsultationRecord,
  deleteConsultationRecord,
  findConsultationsForUser,
  getDoctorMetrics,
  updateConsultationRecord,
} from '../repositories/consultation.repository.js'

export async function listConsultations(request, response, next) {
  try {
    const consultations = await findConsultationsForUser(request.user)
    return response.json({ data: consultations })
  } catch (error) {
    return next(error)
  }
}

export async function createConsultation(request, response, next) {
  const { idPaciente, motivo, diagnostico, tratamiento, observaciones } = request.body
  if (!idPaciente || !motivo || !diagnostico || !tratamiento) {
    return response.status(400).json({ error: 'Faltan datos obligatorios para la consulta.' })
  }

  try {
    const consultation = await createConsultationRecord({
      idPaciente: Number(idPaciente),
      idMedico: request.user.id,
      motivo,
      diagnostico,
      tratamiento,
      observaciones,
    })
    return response.status(201).json({ data: consultation })
  } catch (error) {
    return next(error)
  }
}

export async function updateConsultation(request, response, next) {
  const consultationId = Number(request.params.consultationId)
  const { motivo, diagnostico, tratamiento, observaciones } = request.body

  try {
    const consultation = await updateConsultationRecord(consultationId, {
      motivo,
      diagnostico,
      tratamiento,
      observaciones,
    })
    if (!consultation) return response.status(404).json({ error: 'Consulta no encontrada.' })
    return response.json({ data: consultation })
  } catch (error) {
    return next(error)
  }
}

export async function deleteConsultation(request, response, next) {
  const consultationId = Number(request.params.consultationId)
  try {
    const deleted = await deleteConsultationRecord(consultationId)
    if (!deleted) return response.status(404).json({ error: 'Consulta no encontrada.' })
    return response.json({ data: { success: true } })
  } catch (error) {
    return next(error)
  }
}

export async function getMetrics(request, response, next) {
  try {
    const metrics = await getDoctorMetrics(request.user.id)
    return response.json({ data: metrics })
  } catch (error) {
    return next(error)
  }
}
