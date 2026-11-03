import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestAppointment } from '../src/controllers/appointment.controller.js'
import {
  assignReminder,
  addMedication,
  addVaccine,
  removeVaccine,
} from '../src/controllers/clinical.controller.js'
import { savePreferences } from '../src/controllers/notification.controller.js'
import { listTutors } from '../src/controllers/patient.controller.js'

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

for (const [name, handler, request] of [
  ['medication', addMedication, { body: undefined }],
  ['vaccine', addVaccine, { body: undefined }],
  ['reminder assignment', assignReminder, {
    body: { idEnfermeroAsignado: 'not-an-id' },
    params: { reminderId: '1' },
  }],
  ['appointment', requestAppointment, { body: undefined }],
  ['notification preferences', savePreferences, { body: undefined }],
]) {
  test(`rejects a missing ${name} payload before database access`, async () => {
    const response = createResponse()
    let forwardedError = null

    await handler(request, response, (error) => {
      forwardedError = error
    })

    assert.equal(response.statusCode, 400)
    assert.equal(typeof response.body.error, 'string')
    assert.equal(forwardedError, null)
  })
}

test('rejects tutor searches longer than the supported limit before database access', async () => {
  const response = createResponse()
  let forwardedError = null

  await listTutors(
    { query: { search: 'x'.repeat(81) } },
    response,
    (error) => {
      forwardedError = error
    },
  )

  assert.equal(response.statusCode, 400)
  assert.equal(typeof response.body.error, 'string')
  assert.equal(forwardedError, null)
})

test('rejects an invalid vaccine id before database access', async () => {
  const response = createResponse()
  let forwardedError = null

  await removeVaccine(
    { params: { vaccineId: 'not-an-id' } },
    response,
    (error) => {
      forwardedError = error
    },
  )

  assert.equal(response.statusCode, 400)
  assert.equal(typeof response.body.error, 'string')
  assert.equal(forwardedError, null)
})
