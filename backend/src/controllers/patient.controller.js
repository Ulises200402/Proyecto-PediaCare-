import {
  createPatientWithHistory,
  findPatientForUser,
  findPatientsForUser,
} from '../repositories/patient.repository.js'
import { validateNewPatient } from '../validators/patient.validator.js'

export async function listPatients(request, response, next) {
  try {
    const patients = await findPatientsForUser(request.user)
    return response.json({ data: patients })
  } catch (error) {
    return next(error)
  }
}

export async function getPatient(request, response, next) {
  const patientId = Number(request.params.patientId)
  if (!Number.isSafeInteger(patientId) || patientId < 1) {
    return response.status(400).json({ error: 'El identificador del paciente no es válido.' })
  }

  try {
    const patient = await findPatientForUser(patientId, request.user)
    if (!patient) return response.status(404).json({ error: 'Paciente no encontrado.' })

    return response.json({ data: patient })
  } catch (error) {
    return next(error)
  }
}

export async function createPatient(request, response, next) {
  const validation = validateNewPatient(request.body)
  if (validation.errors) {
    return response.status(400).json({
      error: 'Los datos del paciente no son válidos.',
      details: validation.errors,
    })
  }

  try {
    const patient = await createPatientWithHistory(validation.value)
    return response.status(201).json({ data: patient })
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return response.status(400).json({
        error: 'Los tutores deben ser cuentas existentes de padre/madre.',
      })
    }
    return next(error)
  }
}