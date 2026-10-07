import { pool } from '../config/database.js'

export function getHealth(request, response) {
  response.json({ status: 'ok', service: 'pediacare-api' })
}

export async function getDatabaseHealth(request, response) {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error(`MySQL connection check failed: ${error.code ?? error.message}`)
    response.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'Revisa que MySQL esté iniciado y que la configuración de backend/.env sea correcta.',
    })
  }
}