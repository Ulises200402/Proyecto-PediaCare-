import { pool } from '../config/database.js'

const notificationSelect = `
  SELECT
    n.id_notificacion AS id,
    n.id_usuario AS idUsuario,
    n.id_paciente AS idPaciente,
    p.nombre AS pacienteNombre,
    n.canal,
    n.tipo,
    CASE n.tipo
      WHEN 'consulta' THEN 'Nueva consulta registrada'
      WHEN 'medicacion' THEN 'Novedad de medicación'
      WHEN 'turno' THEN 'Actualización de turno'
      WHEN 'vacuna' THEN 'Actualización de vacunas'
      ELSE 'Notificación'
    END AS titulo,
    n.contenido AS mensaje,
    n.estado,
    n.fecha_creacion AS fecha,
    n.leida
  FROM notificacion AS n
  LEFT JOIN paciente AS p ON p.id_paciente = n.id_paciente`

export async function findNotificationsForUser(user) {
  const [rows] = await pool.execute(
    `${notificationSelect}
     WHERE n.id_usuario = ?
     ORDER BY n.fecha_creacion DESC
     LIMIT 100`,
    [user.id],
  )
  return rows
}

export async function createNotificationRecord(notification) {
  const [result] = await pool.execute(
    `INSERT INTO notificacion
       (id_usuario, id_paciente, canal, contenido, estado, fecha_envio)
     VALUES (?, ?, ?, ?, 'Enviada', NOW())`,
    [
      notification.idUsuario,
      notification.idPaciente || null,
      notification.canal || 'APP',
      notification.contenido,
    ],
  )

  const [rows] = await pool.execute(
    `${notificationSelect} WHERE n.id_notificacion = ? LIMIT 1`,
    [result.insertId],
  )
  return rows[0] ?? null
}

export async function markNotificationAsRead(notificationId, userId) {
  await pool.execute(
    `UPDATE notificacion SET leida = TRUE
     WHERE id_notificacion = ? AND id_usuario = ?`,
    [notificationId, userId],
  )

  const [rows] = await pool.execute(
    `${notificationSelect}
     WHERE n.id_notificacion = ? AND n.id_usuario = ? LIMIT 1`,
    [notificationId, userId],
  )
  return rows[0] ? { ...rows[0], leida: Boolean(rows[0].leida) } : null
}

const defaultTypes = {
  turnos: true,
  medicacion: true,
  consultas: true,
  vacunas: true,
}

export async function findNotificationPreferences(userId) {
  const [rows] = await pool.execute(
    `SELECT recibe_notificaciones_app AS app, preferencias_notificacion AS tipos
     FROM padre_madre WHERE id_usuario = ? LIMIT 1`,
    [userId],
  )
  const preferences = rows[0]
  if (!preferences) return null
  const types = typeof preferences.tipos === 'string'
    ? JSON.parse(preferences.tipos || '{}')
    : preferences.tipos
  return {
    canales: { app: Boolean(preferences.app), email: false, sms: false },
    tipos: { ...defaultTypes, ...(types || {}) },
  }
}

export async function updateNotificationPreferences(userId, preferences) {
  await pool.execute(
    `UPDATE padre_madre
     SET recibe_notificaciones_app = ?, preferencias_notificacion = ?
     WHERE id_usuario = ?`,
    [
      preferences.canales.app,
      JSON.stringify(preferences.tipos),
      userId,
    ],
  )
  return findNotificationPreferences(userId)
}
