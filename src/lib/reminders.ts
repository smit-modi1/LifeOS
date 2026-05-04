import type {
  PendingReminderDelivery,
  Reminder,
  ReminderChannel,
  ReminderDelivery,
  ReminderOwner,
  ReminderRecurrence,
  ReminderTarget,
} from '../types/reminders'
import { createId, nowIso } from './lifeos'

const supportedChannels: ReminderChannel[] = ['in-app', 'email']

export interface CreateReminderInput {
  id?: string
  owner: ReminderOwner
  target: ReminderTarget
  channels: ReminderChannel[]
  triggerAt: string
  recurrence?: ReminderRecurrence | null
}

const assertSupportedChannels = (channels: ReminderChannel[]) => {
  for (const channel of channels) {
    if (!supportedChannels.includes(channel)) {
      throw new Error(`Unsupported reminder channel: ${channel}`)
    }
  }
}

const assertOwnerMatchesTarget = (owner: ReminderOwner, target: ReminderTarget) => {
  if (owner.kind === 'personal' && target.kind !== 'private-item') {
    throw new Error('Personal reminders can only target private items')
  }

  if (owner.kind === 'shared') {
    if (target.kind === 'private-item') {
      throw new Error('Shared reminders can only target shared-space tasks or items')
    }

    if (owner.spaceId !== target.spaceId) {
      throw new Error('Shared reminder owner and target must use the same space')
    }
  }
}

export const createReminder = ({
  id = createId(),
  owner,
  target,
  channels,
  triggerAt,
  recurrence = null,
}: CreateReminderInput): Reminder => {
  assertSupportedChannels(channels)
  assertOwnerMatchesTarget(owner, target)

  const timestamp = nowIso()

  return {
    id,
    owner,
    target,
    channels: [...channels],
    triggerAt,
    recurrence,
    deliveries: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const getReminderDedupeKey = (
  reminderId: string,
  occurrenceAt: string,
  channel: ReminderChannel,
) => `${reminderId}:${occurrenceAt}:${channel}`

export const hasReminderDelivery = (
  deliveries: ReminderDelivery[],
  dedupeKey: string,
) => deliveries.some((delivery) => delivery.dedupeKey === dedupeKey)

export const getPendingReminderDeliveries = (
  reminders: Reminder[],
  now: string,
): PendingReminderDelivery[] => reminders.flatMap((reminder) => {
  if (Date.parse(reminder.triggerAt) > Date.parse(now)) {
    return []
  }

  return reminder.channels.flatMap((channel) => {
    const occurrenceAt = reminder.triggerAt
    const dedupeKey = getReminderDedupeKey(reminder.id, occurrenceAt, channel)

    if (hasReminderDelivery(reminder.deliveries, dedupeKey)) {
      return []
    }

    return [{ reminder, channel, occurrenceAt, dedupeKey }]
  })
})

export const markReminderDelivered = (
  reminder: Reminder,
  channel: ReminderChannel,
  deliveredAt: string,
  occurrenceAt = reminder.triggerAt,
): Reminder => {
  const dedupeKey = getReminderDedupeKey(reminder.id, occurrenceAt, channel)

  if (hasReminderDelivery(reminder.deliveries, dedupeKey)) {
    return reminder
  }

  return {
    ...reminder,
    deliveries: [
      ...reminder.deliveries,
      { channel, occurrenceAt, deliveredAt, dedupeKey },
    ],
    updatedAt: nowIso(),
  }
}
