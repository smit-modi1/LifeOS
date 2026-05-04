import type { AppContext, SpaceSummary } from '../types/spaces'
import { createId, nowIso } from './lifeos'

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

const spacesStorageKey = (userId: string) => `lifeos-spaces-${userId}`

export const createPersonalContext = (userId: string): AppContext => ({
  kind: 'personal',
  userId,
})

export const createSpaceContext = (userId: string, spaceId: string): AppContext => ({
  kind: 'space',
  userId,
  spaceId,
})

export const createSpaceSummary = ({
  id = createId(),
  name,
  ownerId,
}: {
  id?: string
  name: string
  ownerId: string
}): SpaceSummary => {
  const timestamp = nowIso()

  return {
    id,
    name,
    ownerId,
    role: 'owner',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const getActiveContextLabel = (
  context: AppContext,
  spaces: SpaceSummary[],
) => {
  if (context.kind === 'personal') {
    return 'Personal'
  }

  return spaces.find((space) => space.id === context.spaceId)?.name ?? 'Shared space'
}

export const loadSpaceSummaries = (
  storage: StorageLike | null,
  userId: string,
): SpaceSummary[] => {
  const raw = storage?.getItem(spacesStorageKey(userId))
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as SpaceSummary[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const saveSpaceSummaries = (
  storage: StorageLike | null,
  userId: string,
  spaces: SpaceSummary[],
) => {
  storage?.setItem(spacesStorageKey(userId), JSON.stringify(spaces))
}
