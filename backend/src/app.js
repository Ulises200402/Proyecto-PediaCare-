import express from 'express'
import authRouter from './routes/auth.routes.js'
import healthRouter from './routes/health.routes.js'
import patientRouter from './routes/patient.routes.js'
import consultationRouter from './routes/consultation.routes.js'
import appointmentRouter from './routes/appointment.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

app.use(express.json())
app.use('/api/auth', authRouter)
app.use('/api/health', healthRouter)
app.use('/api/patients', patientRouter)
app.use('/api/consultations', consultationRouter)
app.use('/api/appointments', appointmentRouter)

app.use((request, response) => {
  response.status(404).json({ error: 'Recurso no encontrado' })
})

app.use(errorHandler)

export default app