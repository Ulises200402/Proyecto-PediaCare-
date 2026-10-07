import assert from 'node:assert/strict'
import test from 'node:test'
import { createAccessToken, verifyAccessToken } from '../src/services/token.service.js'

test('development can issue and verify a token without a stored JWT secret', () => {
  const previousSecret = process.env.JWT_SECRET
  const previousEnvironment = process.env.NODE_ENV
  delete process.env.JWT_SECRET
  process.env.NODE_ENV = 'development'

  try {
    const token = createAccessToken({ id_usuario: 42, rol: 'MEDICO' })
    const payload = verifyAccessToken(token)
    assert.equal(payload.sub, '42')
    assert.equal(payload.rol, 'MEDICO')
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
    if (previousEnvironment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousEnvironment
  }
})

test('production refuses to issue tokens without a configured secret', () => {
  const previousSecret = process.env.JWT_SECRET
  const previousEnvironment = process.env.NODE_ENV
  delete process.env.JWT_SECRET
  process.env.NODE_ENV = 'production'

  try {
    assert.throws(
      () => createAccessToken({ id_usuario: 42, rol: 'MEDICO' }),
      { statusCode: 503 },
    )
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = previousSecret
    if (previousEnvironment === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previousEnvironment
  }
})