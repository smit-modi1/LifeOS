import { createEmptyLifeOsData, createRecord } from './lifeos'
import { migrateLegacyLifeOsData } from './migration'

test('moves old single-user sensitive data into private vault modules', () => {
  const legacy = createEmptyLifeOsData()
  legacy.profile.fullName = 'Modi'
  legacy.notes.items = [createRecord({ title: 'Private', content: 'Keep safe', label: 'Vault', createdOn: '2026-05-05' })]

  const result = migrateLegacyLifeOsData(legacy, 'user-1')

  expect(result.userId).toBe('user-1')
  expect(result.privateModules.profile.fullName).toBe('Modi')
  expect(result.privateModules.notes.items[0].title).toBe('Private')
})

test('does not publish existing data into shared spaces automatically', () => {
  const legacy = createEmptyLifeOsData()
  legacy.work.projects = [createRecord({
    name: 'Secret project',
    status: 'Active' as const,
    description: '',
    priority: 'High' as const,
    addedOn: '2026-05-05',
    tasks: [],
  })]

  const result = migrateLegacyLifeOsData(legacy, 'user-1')

  expect(result.sharedSpaces).toEqual([])
  expect(result.personalModules.work.projects[0].name).toBe('Secret project')
})
