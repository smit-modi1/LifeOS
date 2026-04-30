import { LocalLifeOsRepository } from './repositories'
import { createRecord } from './lifeos'

const createMemoryStorage = () => {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

test('local repository returns defaults when storage is empty', async () => {
  const repository = new LocalLifeOsRepository('test-lifeos', createMemoryStorage())

  const data = await repository.load('local')

  expect(data.profile.fullName).toBe('')
  expect(data.notes.items).toEqual([])
})

test('local repository persists one module without losing the others', async () => {
  const repository = new LocalLifeOsRepository('test-lifeos', createMemoryStorage())
  const project = createRecord({
    name: 'LifeOS Android',
    status: 'Active' as const,
    description: '',
    priority: 'High' as const,
    addedOn: '2026-04-23',
    tasks: []
  })

  await repository.saveModule('local', 'work', { projects: [project] })
  await repository.saveModule('local', 'notes', {
    items: [createRecord({ title: 'Plan', content: 'Ship it', label: 'Roadmap', createdOn: '2026-04-23' })],
  })

  const data = await repository.load('local')

  expect(data.work.projects).toHaveLength(1)
  expect(data.notes.items).toHaveLength(1)
  expect(data.profile.fullName).toBe('')
})
