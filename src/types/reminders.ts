import type { ModuleKey } from './lifeos'

export type ReminderChannel = 'in-app' | 'email'

export type ReminderOwner =
  | { kind: 'personal'; userId: string }
  | { kind: 'shared'; spaceId: string }

export type ReminderTarget =
  | { kind: 'private-item'; module: ModuleKey; itemId: string }
  | { kind: 'shared-task'; spaceId: string; itemId: string }
  | { kind: 'shared-item'; spaceId: string; itemId: string }

export type ReminderRecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface ReminderRecurrence {
  frequency: ReminderRecurrenceFrequency
  interval: number
  endsAt: string | null
}

export interface ReminderDelivery {
  channel: ReminderChannel
  occurrenceAt: string
  deliveredAt: string
  dedupeKey: string
}

export interface Reminder {
  id: string
  owner: ReminderOwner
  target: ReminderTarget
  channels: ReminderChannel[]
  triggerAt: string
  recurrence: ReminderRecurrence | null
  deliveries: ReminderDelivery[]
  createdAt: string
  updatedAt: string
}

export interface PendingReminderDelivery {
  reminder: Reminder
  channel: ReminderChannel
  occurrenceAt: string
  dedupeKey: string
}
