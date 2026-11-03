import { Router } from 'express'
import {
  getPreferences,
  listNotifications,
  markAsRead,
  savePreferences,
} from '../controllers/notification.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const notificationRouter = Router()

notificationRouter.use(authenticate)
notificationRouter.get('/preferences', authorizeRoles('PADRE_MADRE'), getPreferences)
notificationRouter.put('/preferences', authorizeRoles('PADRE_MADRE'), savePreferences)
notificationRouter.get('/', authorizeRoles('PADRE_MADRE', 'MEDICO', 'ENFERMERO'), listNotifications)
notificationRouter.patch('/:notificationId/read', authorizeRoles('PADRE_MADRE', 'MEDICO', 'ENFERMERO'), markAsRead)

export default notificationRouter
