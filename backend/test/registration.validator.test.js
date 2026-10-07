import assert from 'node:assert/strict'
import test from 'node:test'
import { isRegistrationCodeValid } from '../src/services/registration.service.js'
import { validateRegistration } from '../src/validators/registration.validator.js'

test('validates and normalizes a parent account', () => {
  const result = validateRegistration({
    nombre: '  Marina Torres ',
    email: ' MARINA@EXAMPLE.COM ',
    password: 'a-secure-password',
    role: 'PADRE_MADRE',
    telefono: '  1112345678 ',
  })

  assert.deepEqual(result.errors, undefined)
  assert.equal(result.value.nombre, 'Marina Torres')
  assert.equal(result.value.email, 'marina@example.com')
  assert.equal(result.value.telefono, '1112345678')
})

test('requires professional profile fields and a registration code', () => {
  const result = validateRegistration({
    nombre: 'Lucía Benítez',
    email: 'lucia@example.com',
    password: 'a-secure-password',
    role: 'MEDICO',
    matricula: 'MAT-123',
    especialidad: 'Pediatría',
  })

  assert.ok(result.errors.some((error) => error.includes('registrationCode')))
  assert.equal(result.value, undefined)
})

test('requires separate server-side registration codes for clinician roles', () => {
  const previousDoctorCode = process.env.MEDICO_REGISTRATION_CODE
  const previousNurseCode = process.env.ENFERMERO_REGISTRATION_CODE
  process.env.MEDICO_REGISTRATION_CODE = 'private-doctor-code'
  process.env.ENFERMERO_REGISTRATION_CODE = 'private-nurse-code'

  try {
    assert.equal(isRegistrationCodeValid('MEDICO', 'private-doctor-code'), true)
    assert.equal(isRegistrationCodeValid('MEDICO', 'private-nurse-code'), false)
    assert.equal(isRegistrationCodeValid('ENFERMERO', 'private-nurse-code'), true)
    assert.equal(isRegistrationCodeValid('PADRE_MADRE', 'private-doctor-code'), false)
  } finally {
    if (previousDoctorCode === undefined) delete process.env.MEDICO_REGISTRATION_CODE
    else process.env.MEDICO_REGISTRATION_CODE = previousDoctorCode
    if (previousNurseCode === undefined) delete process.env.ENFERMERO_REGISTRATION_CODE
    else process.env.ENFERMERO_REGISTRATION_CODE = previousNurseCode
  }
})