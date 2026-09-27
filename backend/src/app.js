import express from 'express'
import healthRouter from './routes/health.routes.js'

const app = express()

app.use(express.json())
app.use('/api/health', healthRouter)

app.use((request, response) => {
  response.status(404).json({ error: 'Recurso no encontrado' })
})

export default app