const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildAvailabilityWindowCreateDto,
  buildAvailabilityWindowUpdateDto,
} = require('./availability.dto')

test('buildAvailabilityWindowCreateDto rechaza rangos invertidos', () => {
  assert.throws(
    () => buildAvailabilityWindowCreateDto({
      userNCarnet: '247001',
      fromDateTime: '2026-03-25T10:00:00.000Z',
      toDateTime: '2026-03-25T09:00:00.000Z',
      availabilityType: 'available',
    }),
    /toDateTime/,
  )
})

test('buildAvailabilityWindowCreateDto valida tipos permitidos', () => {
  assert.throws(
    () => buildAvailabilityWindowCreateDto({
      userNCarnet: '247001',
      fromDateTime: '2026-03-25T10:00:00.000Z',
      toDateTime: '2026-03-25T11:00:00.000Z',
      availabilityType: 'other',
    }),
    /available|unavailable/,
  )
})

test('buildAvailabilityWindowUpdateDto exige al menos un campo', () => {
  assert.throws(
    () => buildAvailabilityWindowUpdateDto({}),
    /al menos un campo/,
  )
})
