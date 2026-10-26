import { Router } from 'express'
import {
  createConsultation,
  deleteConsultation,
  getMetrics,
  listConsultations,
  updateConsultation,
} from '../controllers/consultation.controller.js'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'

const consultationRouter = Router()

consultationRouter.use(authenticate)
consultationRouter.get('/', authorizeRoles('MEDICO', 'ENFERMERO', 'PADRE_MADRE'), listConsultations)
consultationRouter.get('/metrics', authorizeRoles('MEDICO'), getMetrics)
consultationRouter.post('/', authorizeRoles('MEDICO'), createConsultation)
consultationRouter.put('/:consultationId', authorizeRoles('MEDICO'), updateConsultation)
consultationRouter.delete('/:consultationId', authorizeRoles('MEDICO'), deleteConsultation)

export default consultationRouter