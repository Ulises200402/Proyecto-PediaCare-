import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requireRegistrationCode } from '../src/middleware/registration-code.middleware.js'

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

test('rejects a missing or incorrect clinician registration code', () => {
  const previousCode = process.env.MEDICO_REGISTRATION_CODE
  process.env.MEDICO_REGISTRATION_CODE = 'test-owner-code'

  try {
    for (const suppliedCode of [undefined, 'incorrect-code']) {
      const response = createResponse()
      let continued = false
      requireRegistrationCode(
        {
          user: { role: 'MEDICO' },
          get: () => suppliedCode,
        },
        response,
        () => {
          continued = true
        },
      )

      assert.equal(response.statusCode, 403)
      assert.equal(typeof response.body.error, 'string')
      assert.equal(continued, false)
    }
  } finally {
    if (previousCode === undefined) delete process.env.MEDICO_REGISTRATION_CODE
    else process.env.MEDICO_REGISTRATION_CODE = previousCode
  }
})

test('accepts a clinician registration code that matches the role', () => {
  const previousCode = process.env.ENFERMERO_REGISTRATION_CODE
  process.env.ENFERMERO_REGISTRATION_CODE = 'test-owner-code'

  try {
    let continued = false
    const response = createResponse()
    requireRegistrationCode(
      {
        user: { role: 'ENFERMERO' },
        get: () => 'test-owner-code',
      },
      response,
      () => {
        continued = true
      },
    )

    assert.equal(continued, true)
    assert.equal(response.statusCode, null)
  } finally {
    if (previousCode === undefined) delete process.env.ENFERMERO_REGISTRATION_CODE
    else process.env.ENFERMERO_REGISTRATION_CODE = previousCode
  }
})
