import { Router } from 'express'
import {
  createPatient,
  getPatient,
  listPatients,
} from '../controllers/patient.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const patientRouter = Router()

patientRouter.use(authenticate)
patientRouter.get('/', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listPatients)
patientRouter.get('/:patientId', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), getPatient)
patientRouter.post('/', authorizeRoles('MEDICO'), createPatient)

export default patientRouter