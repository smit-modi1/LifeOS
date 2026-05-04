import type { EmailInvite, Invite, InviteRole, LinkInvite } from '../types/invites'
import { createId, nowIso } from './lifeos'

export const INVITE_ROLES: InviteRole[] = ['owner', 'editor', 'viewer']

const assignableRolesByCreator: Record<InviteRole, InviteRole[]> = {
  owner: INVITE_ROLES,
  editor: ['editor', 'viewer'],
  viewer: [],
}

type CreateInviteBaseInput = {
  id?: string
  spaceId: string
  createdByUserId: string
  creatorRole: InviteRole
  role: InviteRole
  createdAt?: string
  expiresAt?: string
}

export type CreateEmailInviteInput = CreateInviteBaseInput & {
  email: string
}

export type CreateInviteLinkInput = CreateInviteBaseInput & {
  token?: string
  expiresAt: string
}

export const getAssignableInviteRoles = (creatorRole: InviteRole): InviteRole[] => [
  ...assignableRolesByCreator[creatorRole],
]

export const canAssignInviteRole = (
  creatorRole: InviteRole,
  invitedRole: InviteRole,
) => assignableRolesByCreator[creatorRole].includes(invitedRole)

const assertCanAssignInviteRole = (
  creatorRole: InviteRole,
  invitedRole: InviteRole,
) => {
  if (!canAssignInviteRole(creatorRole, invitedRole)) {
    throw new Error(`You cannot invite someone with the ${invitedRole} role.`)
  }
}

export const createEmailInvite = ({
  id = createId(),
  spaceId,
  createdByUserId,
  creatorRole,
  email,
  role,
  createdAt = nowIso(),
  expiresAt,
}: CreateEmailInviteInput): EmailInvite => {
  assertCanAssignInviteRole(creatorRole, role)

  return {
    id,
    kind: 'email',
    spaceId,
    createdByUserId,
    email,
    role,
    status: 'pending',
    createdAt,
    expiresAt,
  }
}

export const createInviteLink = ({
  id = createId(),
  token = createId(),
  spaceId,
  createdByUserId,
  creatorRole,
  role,
  createdAt = nowIso(),
  expiresAt,
}: CreateInviteLinkInput): LinkInvite => {
  assertCanAssignInviteRole(creatorRole, role)

  return {
    id,
    kind: 'link',
    token,
    spaceId,
    createdByUserId,
    role,
    status: 'pending',
    createdAt,
    expiresAt,
  }
}

export const isInviteExpired = (
  invite: Pick<Invite, 'expiresAt'>,
  at = nowIso(),
) => Boolean(invite.expiresAt && Date.parse(at) >= Date.parse(invite.expiresAt))

export const revokeInvite = <TInvite extends Invite>(
  invite: TInvite,
  revokedAt = nowIso(),
): TInvite => ({
  ...invite,
  status: 'revoked',
  revokedAt,
})
