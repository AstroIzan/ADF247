const test = require('node:test')
const assert = require('node:assert/strict')

const { __matchingInternals } = require('./convos.service')

const { resolveAvailabilityDecision } = __matchingInternals

test('resolveAvailabilityDecision aplica unavailable-wins en conflicto', () => {
  const result = resolveAvailabilityDecision(
    [{ availabilityType: 'available' }, { availabilityType: 'unavailable' }],
    {
      conflictPolicy: 'unavailable-wins',
      createAvailableResponses: true,
      createUnavailableResponses: true,
    }
  )

  assert.equal(result, false)
})

test('resolveAvailabilityDecision aplica available-wins en conflicto', () => {
  const result = resolveAvailabilityDecision(
    [{ availabilityType: 'available' }, { availabilityType: 'unavailable' }],
    {
      conflictPolicy: 'available-wins',
      createAvailableResponses: true,
      createUnavailableResponses: true,
    }
  )

  assert.equal(result, true)
})

test('resolveAvailabilityDecision aplica skip-on-conflict en conflicto', () => {
  const result = resolveAvailabilityDecision(
    [{ availabilityType: 'available' }, { availabilityType: 'unavailable' }],
    {
      conflictPolicy: 'skip-on-conflict',
      createAvailableResponses: true,
      createUnavailableResponses: true,
    }
  )

  assert.equal(result, null)
})

test('resolveAvailabilityDecision respeta flags createAvailable/createUnavailable', () => {
  const unavailableDisabled = resolveAvailabilityDecision(
    [{ availabilityType: 'unavailable' }],
    {
      conflictPolicy: 'unavailable-wins',
      createAvailableResponses: true,
      createUnavailableResponses: false,
    }
  )

  const availableDisabled = resolveAvailabilityDecision(
    [{ availabilityType: 'available' }],
    {
      conflictPolicy: 'available-wins',
      createAvailableResponses: false,
      createUnavailableResponses: true,
    }
  )

  assert.equal(unavailableDisabled, null)
  assert.equal(availableDisabled, null)
})
