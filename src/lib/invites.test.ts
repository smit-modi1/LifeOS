import {
  canAssignInviteRole,
  createEmailInvite,
  createInviteLink,
  getAssignableInviteRoles,
  isInviteExpired,
  revokeInvite,
} from './invites'

test('owners can create expiring invite links with a role', () => {
  const invite = createInviteLink({
    id: 'invite-1',
    token: 'token-1',
    spaceId: 'space-1',
    createdByUserId: 'owner-1',
    creatorRole: 'owner',
    role: 'editor',
    createdAt: '2026-05-05T09:00:00.000Z',
    expiresAt: '2026-05-12T09:00:00.000Z',
  })

  expect(invite).toEqual({
    id: 'invite-1',
    kind: 'link',
    token: 'token-1',
    spaceId: 'space-1',
    createdByUserId: 'owner-1',
    role: 'editor',
    status: 'pending',
    createdAt: '2026-05-05T09:00:00.000Z',
    expiresAt: '2026-05-12T09:00:00.000Z',
  })
})

test('editors cannot transfer ownership through invites', () => {
  expect(canAssignInviteRole('editor', 'owner')).toBe(false)
  expect(getAssignableInviteRoles('editor')).toEqual(['editor', 'viewer'])
  expect(() =>
    createInviteLink({
      spaceId: 'space-1',
      createdByUserId: 'editor-1',
      creatorRole: 'editor',
      role: 'owner',
      expiresAt: '2026-05-12T09:00:00.000Z',
    }),
  ).toThrow('You cannot invite someone with the owner role.')
})

test('email invites create pending invite records', () => {
  const invite = createEmailInvite({
    id: 'invite-2',
    spaceId: 'space-1',
    createdByUserId: 'owner-1',
    creatorRole: 'owner',
    email: 'friend@example.com',
    role: 'viewer',
    createdAt: '2026-05-05T09:00:00.000Z',
    expiresAt: '2026-05-12T09:00:00.000Z',
  })

  expect(invite).toEqual({
    id: 'invite-2',
    kind: 'email',
    spaceId: 'space-1',
    createdByUserId: 'owner-1',
    email: 'friend@example.com',
    role: 'viewer',
    status: 'pending',
    createdAt: '2026-05-05T09:00:00.000Z',
    expiresAt: '2026-05-12T09:00:00.000Z',
  })
})

test('invite expiry and revoke helpers update invite availability', () => {
  const invite = createEmailInvite({
    id: 'invite-3',
    spaceId: 'space-1',
    createdByUserId: 'owner-1',
    creatorRole: 'owner',
    email: 'friend@example.com',
    role: 'viewer',
    createdAt: '2026-05-05T09:00:00.000Z',
    expiresAt: '2026-05-06T09:00:00.000Z',
  })

  expect(isInviteExpired(invite, '2026-05-06T08:59:59.999Z')).toBe(false)
  expect(isInviteExpired(invite, '2026-05-06T09:00:00.000Z')).toBe(true)

  expect(revokeInvite(invite, '2026-05-05T10:00:00.000Z')).toEqual({
    ...invite,
    status: 'revoked',
    revokedAt: '2026-05-05T10:00:00.000Z',
  })
})
