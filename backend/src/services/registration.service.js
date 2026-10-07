import { timingSafeEqual } from 'node:crypto'

const registrationCodeVariables = {
  MEDICO: 'MEDICO_REGISTRATION_CODE',
  ENFERMERO: 'ENFERMERO_REGISTRATION_CODE',
}

export function isRegistrationCodeValid(role, suppliedCode) {
  const variableName = registrationCodeVariables[role]
  const expectedCode = variableName ? process.env[variableName] : undefined

  if (typeof suppliedCode !== 'string' || !expectedCode) return false

  const suppliedBuffer = Buffer.from(suppliedCode)
  const expectedBuffer = Buffer.from(expectedCode)
  return suppliedBuffer.length === expectedBuffer.length
    && timingSafeEqual(suppliedBuffer, expectedBuffer)
}