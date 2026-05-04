# Multi-User Secure LifeOS Design

## Goal

Upgrade LifeOS from a single-user personal tracker into a secure multi-user product with:
- reliable button behavior across the web app
- personal private vault data per user
- multiple shared spaces per user
- MFA-backed authentication
- encrypted private modules
- shared collaborative modules
- in-app and email reminders
- Google Drive link and folder reference support

## Product Direction

This design follows a secure multi-user core first approach.

The app should be safe to share with friends and family while keeping each user's sensitive data private. Collaboration should be easy in shared spaces, but personal data should stay separate by default.

## Account Model

Each person has an individual LifeOS account.

Authentication uses Firebase Auth with:
- email/password sign-in
- Google sign-in
- MFA support
- the same identity across private vault, shared spaces, reminders, and Drive linking

MFA should be required for sensitive account actions and strongly encouraged during setup.

## Information Architecture

Each user can belong to multiple spaces.

Top-level contexts:
- `Personal`
- one or more shared spaces such as `Family`, `Friends`, `Startup`, `Fitness`, `Reading Club`

The app needs a clear context switcher so the user always knows whether they are editing:
- their private vault
- a specific shared space

Each context should visually label data as `Private` or `Shared`.

## Storage Model

### Private vault

Private vault data belongs only to one user and is encrypted client-side before being stored.

Initial encrypted private modules:
- profile
- wealth
- notes
- wishes

Suggested Firestore shape:

```text
users/{userId}
users/{userId}/private/profile
users/{userId}/private/wealth
users/{userId}/private/notes
users/{userId}/private/wishes
users/{userId}/settings/*
users/{userId}/links/googleDrive/*
users/{userId}/reminders/*
```

### Shared spaces

Shared spaces are collaborative and readable by the app for authorized members.

Suggested Firestore shape:

```text
spaces/{spaceId}
spaces/{spaceId}/members/{userId}
spaces/{spaceId}/modules/habits
spaces/{spaceId}/modules/projects
spaces/{spaceId}/modules/reading
spaces/{spaceId}/modules/family
spaces/{spaceId}/modules/hobbies
spaces/{spaceId}/reminders/{reminderId}
spaces/{spaceId}/links/{linkId}
spaces/{spaceId}/invites/{inviteId}
```

Users may also have personal versions of collaborative modules if needed, but that is separate from encrypted vault modules.

## Security Model

### Private data protection

Private vault modules are encrypted in the client before upload.

This means:
- Firestore stores ciphertext for private modules
- only the authenticated user can decrypt their own private vault
- app logic must separate encrypted and non-encrypted data paths cleanly

### Shared space protection

Shared space data uses Firestore access control through membership and roles.

Roles:
- owner
- editor
- viewer

Security rules must ensure:
- only members can read space data
- only owners can manage roles and destructive actions
- editors can modify allowed collaborative modules
- viewers can read but not write

### Sensitive actions

Require recent authentication and MFA for:
- changing MFA settings
- exporting private vault data
- deleting account
- changing encryption recovery settings
- transferring space ownership
- accepting certain high-trust invite actions if needed

## Sharing Model

Each user can create multiple independent shared spaces.

Spaces support both:
- email invites
- shareable invite links

Invite link controls:
- expiry date
- max uses
- assigned role
- optional disable/revoke

Email invite is the default invite path. Invite links are optional for faster onboarding.

Personal data is never shared automatically. Users must explicitly add content into a shared space.

## Encrypted Module Scope

Encrypted from day one:
- profile
- wealth
- notes
- wishes

Shared and collaboration-friendly from day one:
- habits
- hobbies
- projects
- reading groups
- family coordination modules

## Reminders

Initial reminder channels:
- in-app reminders
- email reminders

Not in initial scope:
- SMS
- WhatsApp

Reminder ownership:
- private reminders for personal items
- shared reminders for shared space items

Reminder capabilities:
- due date reminders
- recurring reminders
- assignment to specific members in shared spaces
- reminder preferences per user

Implementation direction:
- store reminder definitions in Firestore
- use a scheduled backend process to fan out due reminders
- show notification history/status in the app

## Google Drive Support

Initial scope is linking Drive references, not full Drive file management.

Supported from first release:
- attach a Google Drive file link to a task, note, project, or shared item
- attach a Google Drive folder link
- store metadata such as label, URL, owner context, and target entity

Possible later upgrade:
- OAuth-based Drive picker
- folder browsing inside the app
- permission checks and previews

## Button Reliability and UX Hardening

The app must treat "every button works" as an explicit engineering requirement.

This includes:
- navigation buttons
- add/remove/edit actions
- save/update flows
- invite and role actions
- reminder actions
- Drive link actions
- authentication actions
- space switching actions

Approach:
- audit all interactive elements
- add coverage for critical flows
- fix broken local state transitions
- fix persistence/save issues
- add end-to-end verification for main user journeys

## UX Changes

### New top-level navigation

The app should open into a context-aware shell:
- `Personal`
- list of shared spaces
- ability to create a new space

### Space-aware modules

Inside Personal:
- encrypted vault modules
- optional personal collaborative modules

Inside a shared space:
- collaborative modules only
- member management
- reminders
- Drive links
- activity visibility

### Required product surfaces

New product surfaces:
- context switcher
- member list and role editor
- invite manager
- invite link manager
- reminder center
- Drive link attach UI
- account security/MFA settings
- onboarding/migration flow

## Migration Strategy

Existing single-user data should migrate into the account owner's Personal context on first upgrade.

Migration rules:
- existing profile, wealth, notes, wishes become private vault records
- existing collaborative-like modules can initially land in Personal scoped versions
- no data should be silently published into a shared space

Migration must be reversible or at least safe and well logged.

## Free-Tier Platform Direction

Use Firebase free-tier services where practical:
- Firebase Auth
- Firestore
- scheduled backend path as allowed by free-friendly tooling

The design should stay conscious of free-tier limits:
- minimize write amplification
- avoid noisy polling
- batch reminder fan-out where possible

## Testing and Verification

Required verification layers:
- unit tests for encryption helpers and permission logic
- repository tests for personal vs shared storage
- UI tests for buttons and context switching
- reminder workflow tests
- invite and role tests
- doctor command updates for auth, rules, reminder config, and space integrity

## Implementation Order

1. Audit and fix current button behavior and broken flows.
2. Introduce Personal + multi-space context model.
3. Split storage into private vault and shared spaces.
4. Add client-side encryption for private modules.
5. Add roles, memberships, email invites, and invite links.
6. Add in-app and email reminders.
7. Add Google Drive link support.
8. Add migration, doctor checks, and security verification.

## Risks

Main risks:
- mixing current single-user state with new multi-context storage
- leaking private data into shared spaces through incorrect mapping
- building collaboration and encryption logic too tightly together
- reminder delivery complexity on free-tier infrastructure

Mitigations:
- strict boundary between private and shared repositories
- explicit module ownership metadata
- focused migration logic
- progressive rollout with verification gates

## Success Criteria

The upgrade is successful when:
- every user has a separate secure account
- private modules are encrypted client-side
- users can belong to multiple shared spaces
- email invites and invite links work
- in-app and email reminders work
- Drive links can be attached to relevant entities
- all major buttons and core flows are reliable on the web app
