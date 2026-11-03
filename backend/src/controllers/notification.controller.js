import {
  findNotificationPreferences,
  findNotificationsForUser,
  markNotificationAsRead,
  updateNotificationPreferences,
} from '../repositories/notification.repository.js'

export async function listNotifications(request, response, next) {
  try {
    const notifications = await findNotificationsForUser(request.user)
    return response.json({ data: notifications })
  } catch (error) {
    return next(error)
  }
}

export async function markAsRead(request, response, next) {
  const notificationId = Number(request.params.notificationId)
  try {
    const notification = await markNotificationAsRead(notificationId, request.user.id)
    if (!notification) return response.status(404).json({ error: 'Notificación no encontrada.' })
    return response.json({ data: notification })
  } catch (error) {
    return next(error)
  }
}

export async function getPreferences(request, response, next) {
  try {
    const preferences = await findNotificationPreferences(request.user.id)
    if (!preferences) return response.status(404).json({ error: 'Preferencias no encontradas.' })
    return response.json({ data: preferences })
  } catch (error) {
    return next(error)
  }
}

export async function savePreferences(request, response, next) {
  const { canales, tipos } = request.body ?? {}
  const validTypes = ['turnos', 'medicacion', 'consultas', 'vacunas']
  if (!canales || typeof canales.app !== 'boolean' || !tipos ||
      validTypes.some((type) => typeof tipos[type] !== 'boolean')) {
    return response.status(400).json({ error: 'Las preferencias de notificación no son válidas.' })
  }
  try {
    const preferences = await updateNotificationPreferences(request.user.id, {
      canales: { app: canales.app },
      tipos: Object.fromEntries(validTypes.map((type) => [type, tipos[type]])),
    })
    if (!preferences) return response.status(404).json({ error: 'Preferencias no encontradas.' })
    return response.json({ data: preferences })
  } catch (error) {
    return next(error)
  }
}
