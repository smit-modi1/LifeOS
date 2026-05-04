export type SpaceRole = 'owner' | 'editor' | 'viewer'

export type AppContext =
  | { kind: 'personal'; userId: string }
  | { kind: 'space'; userId: string; spaceId: string }

export type SpaceSummary = {
  id: string
  name: string
  ownerId: string
  role: SpaceRole
  createdAt: string
  updatedAt: string
}
