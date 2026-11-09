import { Router } from 'express'
import {
  addMedication,
  addVaccine,
  assignReminder,
  editMedication,
  editVaccine,
  removeVaccine,
  listMedications,
  getNurses,
  listReminders,
  listVaccines,
  setReminderStatus,
} from '../controllers/clinical.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'
import { requireRegistrationCode } from '../middleware/registration-code.middleware.js'

const clinicalRouter = Router()

clinicalRouter.use(authenticate)
clinicalRouter.get('/medications', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listMedications)
clinicalRouter.post('/medications', authorizeRoles('ENFERMERO'), addMedication)
clinicalRouter.put('/medications/:medicationId', authorizeRoles('ENFERMERO'), requireRegistrationCode, editMedication)
clinicalRouter.get('/reminders', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listReminders)
clinicalRouter.get('/nurses', authorizeRoles('MEDICO', 'ENFERMERO'), getNurses)
clinicalRouter.patch('/reminders/:reminderId/assignment', authorizeRoles('MEDICO', 'ENFERMERO'), assignReminder)
clinicalRouter.patch('/reminders/:reminderId/status', authorizeRoles('ENFERMERO'), setReminderStatus)
clinicalRouter.get('/vaccines', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listVaccines)
clinicalRouter.post('/vaccines', authorizeRoles('MEDICO', 'ENFERMERO'), addVaccine)
clinicalRouter.put('/vaccines/:vaccineId', authorizeRoles('MEDICO', 'ENFERMERO'), requireRegistrationCode, editVaccine)
clinicalRouter.delete('/vaccines/:vaccineId', authorizeRoles('MEDICO', 'ENFERMERO'), requireRegistrationCode, removeVaccine)

export default clinicalRouter
