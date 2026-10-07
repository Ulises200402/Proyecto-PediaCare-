import assert from 'node:assert/strict'
import test from 'node:test'
import app from '../src/app.js'
import { authorizeRoles } from '../src/middleware/auth.middleware.js'

test('login rejects empty credentials without querying MySQL', async (context) => {
  const server = app.listen(0, '127.0.0.1')
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  }))

  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), {
    error: 'Email y contraseña son obligatorios.',
  })
})

test('patient routes reject requests without a bearer token', async (context) => {
  const server = app.listen(0, '127.0.0.1')
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  }))

  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()

  for (const path of ['/api/patients', '/api/patients/1']) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`)
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: 'Se requiere autenticación.' })
  }
})

test('role authorization rejects a parent on a doctor-only action', () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
  let nextCalled = false

  authorizeRoles('MEDICO')(
    { user: { role: 'PADRE_MADRE' } },
    response,
    () => { nextCalled = true },
  )

  assert.equal(response.statusCode, 403)
  assert.equal(nextCalled, false)
})

test('role authorization allows a doctor on a doctor-only action', () => {
  const response = { status() { return this }, json() { return this } }
  let nextCalled = false

  authorizeRoles('MEDICO')(
    { user: { role: 'MEDICO' } },
    response,
    () => { nextCalled = true },
  )

  assert.equal(nextCalled, true)
})

test('registration validates the payload before accessing MySQL', async (context) => {
  const server = app.listen(0, '127.0.0.1')
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  }))

  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  assert.equal(response.status, 400)
  const payload = await response.json()
  assert.equal(payload.error, 'Los datos de registro no son válidos.')
  assert.ok(Array.isArray(payload.details))
  assert.ok(payload.details.length > 0)
})

test('clinician registration rejects an invalid invitation code before database access', async (context) => {
  const previousCode = process.env.MEDICO_REGISTRATION_CODE
  process.env.MEDICO_REGISTRATION_CODE = 'private-doctor-code'
  const server = app.listen(0, '127.0.0.1')
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  }))

  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Lucía Benítez',
        email: 'lucia@example.com',
        password: 'a-secure-password',
        role: 'MEDICO',
        matricula: 'MAT-123',
        especialidad: 'Pediatría',
        registrationCode: 'wrong-code',
      }),
    })

    assert.equal(response.status, 403)
    assert.deepEqual(await response.json(), {
      error: 'El código de habilitación no es válido.',
    })
  } finally {
    if (previousCode === undefined) delete process.env.MEDICO_REGISTRATION_CODE
    else process.env.MEDICO_REGISTRATION_CODE = previousCode
  }
})