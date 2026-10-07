import { verifyAccessToken } from '../services/token.service.js'
import { findUserById } from '../repositories/user.repository.js'

const validRoles = new Set(['MEDICO', 'ENFERMERO', 'PADRE_MADRE'])

export async function authenticate(request, response, next) {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({ error: 'Se requiere autenticación.' })
  }

  try {
    const payload = verifyAccessToken(token)
    const userId = Number(payload.sub)

    if (!Number.isSafeInteger(userId) || userId < 1 || !validRoles.has(payload.rol)) {
      return response.status(401).json({ error: 'El token no es válido.' })
    }

    const user = await findUserById(userId)
    if (!user || !user.activo || user.rol !== payload.rol) {
      return response.status(401).json({ error: 'La cuenta no está activa o ya no existe.' })
    }

    request.user = {
      id: user.id_usuario,
      role: user.rol,
      name: user.nombre,
      email: user.email,
    }
    return next()
  } catch (error) {
    if (error.statusCode === 503) return next(error)
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
      return next(error)
    }
    return response.status(401).json({ error: 'El token no es válido o expiró.' })
  }
}

export function authorizeRoles(...roles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({ error: 'Se requiere autenticación.' })
    }

    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ error: 'No tenés permisos para esta acción.' })
    }

    return next()
  }
}