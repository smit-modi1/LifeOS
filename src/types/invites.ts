export type InviteRole = 'owner' | 'editor' | 'viewer'

export type InviteKind = 'email' | 'link'

export type InviteStatus = 'pending' | 'accepted' | 'revoked'

export type BaseInvite = {
  id: string
  kind: InviteKind
  spaceId: string
  createdByUserId: string
  role: InviteRole
  status: InviteStatus
  createdAt: string
  expiresAt?: string
  revokedAt?: string
}

export type EmailInvite = BaseInvite & {
  kind: 'email'
  email: string
}

export type LinkInvite = BaseInvite & {
  kind: 'link'
  token: string
  expiresAt: string
}

export type Invite = EmailInvite | LinkInvite
