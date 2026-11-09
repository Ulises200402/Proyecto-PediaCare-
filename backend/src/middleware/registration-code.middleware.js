import { isRegistrationCodeValid } from '../services/registration.service.js'

export function requireRegistrationCode(request, response, next) {
  const registrationCode = request.get('x-registration-code')
  if (!isRegistrationCodeValid(request.user?.role, registrationCode)) {
    return response.status(403).json({
      error: 'El código de registro no es válido. Solicitá el código vigente al dueño del software.',
    })
  }
  return next()
}
