import {
  createPersonalContext,
  createSpaceContext,
  createSpaceSummary,
  getActiveContextLabel,
} from './spaces'

test('defaults a signed-in user to Personal context', () => {
  expect(createPersonalContext('user-1')).toEqual({ kind: 'personal', userId: 'user-1' })
})

test('switches from Personal to a selected shared space', () => {
  expect(createSpaceContext('user-1', 'space-1')).toEqual({
    kind: 'space',
    userId: 'user-1',
    spaceId: 'space-1',
  })
})

test('labels active space contexts from the user space list', () => {
  const space = createSpaceSummary({
    id: 'space-1',
    name: 'Family',
    ownerId: 'user-1',
  })

  expect(getActiveContextLabel(createSpaceContext('user-1', 'space-1'), [space])).toBe('Family')
})
