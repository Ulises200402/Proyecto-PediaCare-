import { Router } from 'express'
import {
  createPatient,
  editPatient,
  getPatient,
  listPatients,
  listTutors,
} from '../controllers/patient.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const patientRouter = Router()

patientRouter.use(authenticate)
patientRouter.get('/', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listPatients)
patientRouter.get('/tutors', authorizeRoles('MEDICO'), listTutors)
patientRouter.get('/:patientId', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), getPatient)
patientRouter.post('/', authorizeRoles('MEDICO'), createPatient)
patientRouter.put('/:patientId', authorizeRoles('MEDICO'), editPatient)

export default patientRouter