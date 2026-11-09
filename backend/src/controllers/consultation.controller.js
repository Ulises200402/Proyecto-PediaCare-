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
  const patientId = Number(idPaciente)
  if (!Number.isSafeInteger(patientId) || patientId < 1 ||
      ![motivo, diagnostico, tratamiento].every((value) =>
        typeof value === 'string' && value.trim().length > 0) ||
      [motivo, diagnostico, tratamiento, observaciones, request.body.indicacionesParaPadres]
        .some((value) => value !== undefined && value !== null &&
          (typeof value !== 'string' || value.length > 5000))) {
    return response.status(400).json({ error: 'Completá los datos obligatorios de la consulta con valores válidos.' })
  }

  try {
    const consultation = await createConsultationRecord({
      idPaciente: patientId,
      idMedico: request.user.id,
      motivo,
      diagnostico,
      tratamiento,
      observaciones,
      indicacionesParaPadres: request.body.indicacionesParaPadres,
    })
    return response.status(201).json({ data: consultation })
  } catch (error) {
    return next(error)
  }
}

export async function updateConsultation(request, response, next) {
  const consultationId = Number(request.params.consultationId)
  const { motivo, diagnostico, tratamiento, observaciones } = request.body
  if (!Number.isSafeInteger(consultationId) || consultationId < 1 ||
      ![motivo, diagnostico, tratamiento].every((value) =>
        typeof value === 'string' && value.trim().length > 0) ||
      [motivo, diagnostico, tratamiento, observaciones, request.body.indicacionesParaPadres]
        .some((value) => value !== undefined && value !== null &&
          (typeof value !== 'string' || value.length > 5000))) {
    return response.status(400).json({ error: 'Los datos de la consulta no son válidos.' })
  }

  try {
    const consultation = await updateConsultationRecord(consultationId, request.user.id, {
      motivo,
      diagnostico,
      tratamiento,
      observaciones,
      indicacionesParaPadres: request.body.indicacionesParaPadres,
    })
    if (!consultation) return response.status(404).json({ error: 'Consulta no encontrada.' })
    return response.json({ data: consultation })
  } catch (error) {
    return next(error)
  }
}

export async function deleteConsultation(request, response, next) {
  const consultationId = Number(request.params.consultationId)
  if (!Number.isSafeInteger(consultationId) || consultationId < 1) {
    return response.status(400).json({ error: 'El identificador de consulta no es válido.' })
  }
  try {
    const deleted = await deleteConsultationRecord(consultationId, request.user.id)
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
