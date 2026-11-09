import { Router } from 'express'
import {
  cancelAppointment,
  listDoctors,
  listAppointments,
  patchAppointmentStatus,
  requestAppointment,
} from '../controllers/appointment.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const appointmentRouter = Router()

appointmentRouter.use(authenticate)
appointmentRouter.get('/doctors', authorizeRoles('PADRE_MADRE'), listDoctors)
appointmentRouter.get('/', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listAppointments)
appointmentRouter.post('/', authorizeRoles('PADRE_MADRE'), requestAppointment)
appointmentRouter.patch('/:appointmentId/cancel', authorizeRoles('PADRE_MADRE'), cancelAppointment)
appointmentRouter.patch('/:appointmentId/status', authorizeRoles('MEDICO', 'ENFERMERO'), patchAppointmentStatus)

export default appointmentRouter
