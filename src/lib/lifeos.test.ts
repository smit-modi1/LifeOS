import { calculateDashboardStats, createEmptyLifeOsData, createRecord, updateRecord } from './lifeos'

test('creates a full empty LifeOS shape including profile and module buckets', () => {
  const data = createEmptyLifeOsData()

  expect(data.profile.fullName).toBe('')
  expect(data.work.projects).toEqual([])
  expect(data.habits.monthly).toEqual([])
  expect(data.skills.wantToLearn).toEqual([])
  expect(Object.keys(data.reading.wishlist)).toContain('Business')
})

test('creates records with ids and refreshes updatedAt when edited', () => {
  const record = createRecord({ name: 'Ship APK' })
  const updated = updateRecord(record, { name: 'Ship beta APK' })

  expect(record.id).toBeTruthy()
  expect(updated.id).toBe(record.id)
  expect(updated.updatedAt).not.toBe(record.updatedAt)
  expect(updated.name).toBe('Ship beta APK')
})

test('calculates dashboard stats from the current data model', () => {
  const data = createEmptyLifeOsData()
  data.work.projects.push(createRecord({ name: 'Launch', status: 'Active', description: '', priority: 'High', addedOn: '2026-04-23', tasks: [] }))
  data.skills.goodAt.push(createRecord({ name: 'SQL' }))
  data.learning.current.push(createRecord({ name: 'System design', platform: 'Udemy', progress: 40, notes: '' }))

  const stats = calculateDashboardStats(data)

  expect(stats.find((item) => item.id === 'work')?.value).toBe(1)
  expect(stats.find((item) => item.id === 'skills')?.value).toBe(1)
  expect(stats.find((item) => item.id === 'learning')?.value).toBe(1)
})
