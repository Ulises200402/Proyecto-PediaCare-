import assert from 'node:assert/strict'
import test from 'node:test'
import { validateNewPatient } from '../src/validators/patient.validator.js'

test('accepts a patient with one or two distinct parent accounts', () => {
  const result = validateNewPatient({
    nombre: '  Sofía León  ',
    fechaNacimiento: '2021-04-15',
    sexo: 'Femenino',
    idTutor1: 12,
    idTutor2: 13,
    alergias: '  Penicilina  ',
  })

  assert.deepEqual(result.errors, undefined)
  assert.equal(result.value.nombre, 'Sofía León')
  assert.equal(result.value.alergias, 'Penicilina')
  assert.equal(result.value.enfermedadesCronicas, null)
})

test('rejects invalid dates, missing primary tutor, and duplicate tutors', () => {
  const result = validateNewPatient({
    nombre: 'Paciente',
    fechaNacimiento: '2025-02-30',
    sexo: 'Femenino',
    idTutor1: 4,
    idTutor2: 4,
  })

  assert.equal(result.value, undefined)
  assert.equal(result.errors.length, 2)
})

test('rejects a future date of birth', () => {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const result = validateNewPatient({
    nombre: 'Paciente',
    fechaNacimiento: tomorrow,
    sexo: 'Otro',
    idTutor1: 4,
  })

  assert.ok(result.errors.some((error) => error.includes('no futura')))
})