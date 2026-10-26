import { Router } from 'express'
import {
  listAppointments,
  patchAppointmentStatus,
} from '../controllers/appointment.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const appointmentRouter = Router()

appointmentRouter.use(authenticate)
appointmentRouter.get('/', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listAppointments)
appointmentRouter.patch('/:appointmentId/status', authorizeRoles('MEDICO', 'ENFERMERO'), patchAppointmentStatus)

export default appointmentRouter
