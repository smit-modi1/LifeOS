import {
  createReminder,
  getPendingReminderDeliveries,
  markReminderDelivered,
} from './reminders'
import type { ReminderChannel } from '../types/reminders'

test('creates personal reminders for private items with in-app and email channels', () => {
  const reminder = createReminder({
    id: 'reminder-1',
    owner: { kind: 'personal', userId: 'user-1' },
    target: { kind: 'private-item', module: 'wishes', itemId: 'wish-1' },
    channels: ['in-app', 'email'],
    triggerAt: '2026-05-05T08:00:00.000Z',
  })

  expect(reminder.owner).toEqual({ kind: 'personal', userId: 'user-1' })
  expect(reminder.target).toEqual({ kind: 'private-item', module: 'wishes', itemId: 'wish-1' })
  expect(reminder.channels).toEqual(['in-app', 'email'])
  expect(reminder.deliveries).toEqual([])
})

test('creates shared reminders for shared-space tasks and items', () => {
  const reminder = createReminder({
    id: 'reminder-2',
    owner: { kind: 'shared', spaceId: 'space-1' },
    target: { kind: 'shared-task', spaceId: 'space-1', itemId: 'task-1' },
    channels: ['in-app'],
    triggerAt: '2026-05-05T09:00:00.000Z',
  })

  expect(reminder.owner).toEqual({ kind: 'shared', spaceId: 'space-1' })
  expect(reminder.target).toEqual({
    kind: 'shared-task',
    spaceId: 'space-1',
    itemId: 'task-1',
  })
})

test('stores recurrence metadata for future scheduling support', () => {
  const reminder = createReminder({
    id: 'reminder-3',
    owner: { kind: 'personal', userId: 'user-1' },
    target: { kind: 'private-item', module: 'habits', itemId: 'habit-1' },
    channels: ['in-app'],
    triggerAt: '2026-05-05T07:30:00.000Z',
    recurrence: { frequency: 'daily', interval: 1, endsAt: null },
  })

  expect(reminder.recurrence).toEqual({ frequency: 'daily', interval: 1, endsAt: null })
})

test('rejects reminder channels outside in-app and email', () => {
  expect(() => createReminder({
    id: 'reminder-invalid-channel',
    owner: { kind: 'personal', userId: 'user-1' },
    target: { kind: 'private-item', module: 'wishes', itemId: 'wish-1' },
    channels: ['sms' as ReminderChannel],
    triggerAt: '2026-05-05T08:00:00.000Z',
  })).toThrow('Unsupported reminder channel: sms')
})

test('rejects shared-space targets for personal reminders', () => {
  expect(() => createReminder({
    id: 'reminder-invalid-scope',
    owner: { kind: 'personal', userId: 'user-1' },
    target: { kind: 'shared-item', spaceId: 'space-1', itemId: 'item-1' },
    channels: ['in-app'],
    triggerAt: '2026-05-05T08:00:00.000Z',
  })).toThrow('Personal reminders can only target private items')
})

test('returns pending deliveries but skips already delivered reminder channels', () => {
  const reminder = createReminder({
    id: 'reminder-4',
    owner: { kind: 'personal', userId: 'user-1' },
    target: { kind: 'private-item', module: 'work', itemId: 'task-1' },
    channels: ['in-app', 'email'],
    triggerAt: '2026-05-05T10:00:00.000Z',
  })
  const delivered = markReminderDelivered(
    reminder,
    'email',
    '2026-05-05T10:05:00.000Z',
  )

  const pending = getPendingReminderDeliveries(
    [delivered],
    '2026-05-05T10:10:00.000Z',
  )

  expect(pending).toEqual([
    {
      reminder: delivered,
      channel: 'in-app',
      occurrenceAt: '2026-05-05T10:00:00.000Z',
      dedupeKey: 'reminder-4:2026-05-05T10:00:00.000Z:in-app',
    },
  ])
})
