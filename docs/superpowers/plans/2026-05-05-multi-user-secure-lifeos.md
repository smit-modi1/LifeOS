# Multi-User Secure LifeOS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade LifeOS into a secure multi-user app with private encrypted modules, multiple shared spaces, invites, reminders, and Drive link support while fixing all major interactive flows.

**Architecture:** Introduce a clear split between encrypted personal vault data and collaborative shared-space data. Build a context-aware app shell, repository boundaries, membership model, invite flow, reminder model, and UI verification around that separation.

**Tech Stack:** React, TypeScript, Firebase Auth, Firestore, Capacitor, client-side crypto helpers, Vitest, ESLint, npm doctor workflow.

---

### Task 1: Audit and stabilize all existing button flows

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/features/sections.tsx`
- Modify: `src/components/ui.tsx`
- Create: `src/features/sections.test.tsx` or focused UI tests

- [x] **Step 1: Write failing tests for the highest-risk button flows**

```ts
test('creates a new note when New note is clicked', () => {})
test('adds a project when AddRow submits in Work', () => {})
test('marks a wish done when Mark done is clicked', () => {})
test('switches auth mode and submits credentials correctly', () => {})
```

- [x] **Step 2: Run the targeted tests to verify they fail for the intended reasons**

Run: `npm test -- src/features/sections.test.tsx`
Expected: FAIL with missing tests or behavior gaps, not environment errors

- [x] **Step 3: Implement minimal fixes for broken interactions**

```ts
// stabilize click handlers, remove duplicate accidental pointer logic where needed,
// ensure add/remove/update flows route through one consistent save path
```

- [x] **Step 4: Re-run the targeted tests**

Run: `npm test -- src/features/sections.test.tsx`
Expected: PASS

- [x] **Step 5: Run broad regression verification**

Run:
- `npm run lint`
- `npm test`
- `npm run build`

Expected: PASS

### Task 2: Introduce app context model for Personal and multiple spaces

**Files:**
- Modify: `src/types/lifeos.ts`
- Create: `src/types/spaces.ts`
- Create: `src/lib/spaces.ts`
- Modify: `src/hooks/use-lifeos-app.ts`
- Modify: `src/App.tsx`

- [x] **Step 1: Write failing tests for context switching and default personal context**

```ts
test('defaults signed-in user to Personal context', () => {})
test('switches from Personal to a selected shared space', () => {})
```

- [x] **Step 2: Run the targeted tests to verify they fail**

Run: `npm test -- src/lib/spaces.test.ts`
Expected: FAIL because context model is not implemented yet

- [x] **Step 3: Add minimal types and helper functions**

```ts
export type AppContext =
  | { kind: 'personal'; userId: string }
  | { kind: 'space'; userId: string; spaceId: string }
```

- [x] **Step 4: Add a context switcher shell**

```tsx
// render Personal plus user spaces and switch active context in app state
```

- [x] **Step 5: Re-run targeted tests**

Run: `npm test -- src/lib/spaces.test.ts`
Expected: PASS

### Task 3: Split repositories into private vault and shared spaces

**Files:**
- Modify: `src/lib/repositories.ts`
- Create: `src/lib/private-vault-repository.ts`
- Create: `src/lib/shared-space-repository.ts`
- Create: `src/lib/repositories.multi-user.test.ts`
- Modify: `src/lib/firebase.ts`

- [x] **Step 1: Write failing tests for personal vs shared persistence boundaries**

```ts
test('saves encrypted private module data under user private path', () => {})
test('saves shared module data under space module path', () => {})
test('never writes private module data into a shared path', () => {})
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/repositories.multi-user.test.ts`
Expected: FAIL because repositories are not yet split

- [x] **Step 3: Implement minimal repository separation**

```ts
class PrivateVaultRepository {}
class SharedSpaceRepository {}
```

- [x] **Step 4: Update hook orchestration to route saves by active context**

```ts
// if context.kind === 'personal' use private or personal repository
// if context.kind === 'space' use shared space repository
```

- [x] **Step 5: Re-run repository tests**

Run: `npm test -- src/lib/repositories.multi-user.test.ts`
Expected: PASS

### Task 4: Add client-side encryption for private modules

**Files:**
- Create: `src/lib/crypto.ts`
- Create: `src/lib/crypto.test.ts`
- Modify: `src/lib/private-vault-repository.ts`
- Modify: `src/types/lifeos.ts`

- [ ] **Step 1: Write failing tests for encryption and decryption**

```ts
test('encrypts and decrypts private profile payloads', async () => {})
test('stores ciphertext instead of plaintext for notes', async () => {})
```

- [ ] **Step 2: Run targeted crypto tests**

Run: `npm test -- src/lib/crypto.test.ts`
Expected: FAIL because helpers do not exist yet

- [ ] **Step 3: Implement minimal encryption helpers**

```ts
export async function encryptPrivatePayload(...) {}
export async function decryptPrivatePayload(...) {}
```

- [ ] **Step 4: Wire encrypted modules through the private repository**

```ts
// profile, wealth, notes, wishes save/load through crypto helpers
```

- [ ] **Step 5: Re-run targeted tests**

Run: `npm test -- src/lib/crypto.test.ts`
Expected: PASS

### Task 5: Add shared spaces, membership, roles, and invites

**Files:**
- Create: `src/types/invites.ts`
- Create: `src/lib/invites.ts`
- Create: `src/lib/invites.test.ts`
- Modify: `src/hooks/use-lifeos-app.ts`
- Modify: `src/App.tsx`
- Create: UI components for members and invites

- [ ] **Step 1: Write failing tests for membership and invite behavior**

```ts
test('owners can create invite links with expiry and role', () => {})
test('editors cannot transfer ownership', () => {})
test('email invite creates a pending invite record', () => {})
```

- [ ] **Step 2: Run targeted invite tests**

Run: `npm test -- src/lib/invites.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal invite and role models**

```ts
type SpaceRole = 'owner' | 'editor' | 'viewer'
type InviteKind = 'email' | 'link'
```

- [ ] **Step 4: Add member and invite management UI**

```tsx
// owner-facing invite panel, link generator, revoke controls, member roles
```

- [ ] **Step 5: Re-run targeted tests**

Run: `npm test -- src/lib/invites.test.ts`
Expected: PASS

### Task 6: Add in-app and email reminders

**Files:**
- Create: `src/types/reminders.ts`
- Create: `src/lib/reminders.ts`
- Create: `src/lib/reminders.test.ts`
- Modify: `src/features/sections.tsx`
- Add backend or scheduled-delivery support files as needed

- [ ] **Step 1: Write failing tests for reminder scheduling rules**

```ts
test('creates personal reminders for private items', () => {})
test('creates shared reminders for shared-space tasks', () => {})
test('skips duplicate sends for already delivered reminders', () => {})
```

- [ ] **Step 2: Run targeted reminder tests**

Run: `npm test -- src/lib/reminders.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal reminder model**

```ts
type ReminderChannel = 'in-app' | 'email'
```

- [ ] **Step 4: Add reminder UI controls**

```tsx
// due date, recurrence, assignee, channel preferences
```

- [ ] **Step 5: Add reminder delivery integration points**

```ts
// scheduled reminder read/send path and notification status tracking
```

- [ ] **Step 6: Re-run targeted tests**

Run: `npm test -- src/lib/reminders.test.ts`
Expected: PASS

### Task 7: Add Google Drive link support

**Files:**
- Create: `src/types/drive-links.ts`
- Create: `src/lib/drive-links.ts`
- Create: `src/lib/drive-links.test.ts`
- Modify: `src/features/sections.tsx`

- [ ] **Step 1: Write failing tests for Drive link attachment**

```ts
test('attaches a Drive file link to a task', () => {})
test('attaches a Drive folder link to a shared project', () => {})
test('rejects malformed Drive URLs', () => {})
```

- [ ] **Step 2: Run targeted Drive link tests**

Run: `npm test -- src/lib/drive-links.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal Drive link validation and storage helpers**

```ts
export function normalizeDriveLink(url: string) {}
```

- [ ] **Step 4: Add attach-link UI in relevant modules**

```tsx
// button + modal or inline form for Drive file/folder URL attachment
```

- [ ] **Step 5: Re-run targeted tests**

Run: `npm test -- src/lib/drive-links.test.ts`
Expected: PASS

### Task 8: Add migration for existing single-user data

**Files:**
- Create: `src/lib/migration.ts`
- Create: `src/lib/migration.test.ts`
- Modify: `src/hooks/use-lifeos-app.ts`

- [ ] **Step 1: Write failing migration tests**

```ts
test('moves old single-user profile data into private vault on upgrade', () => {})
test('does not publish any existing data into shared spaces automatically', () => {})
```

- [ ] **Step 2: Run targeted migration tests**

Run: `npm test -- src/lib/migration.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal migration logic**

```ts
export async function migrateLegacyLifeOsData(...) {}
```

- [ ] **Step 4: Trigger migration during post-auth app bootstrap**

```ts
// detect old shape, migrate once, mark complete
```

- [ ] **Step 5: Re-run targeted tests**

Run: `npm test -- src/lib/migration.test.ts`
Expected: PASS

### Task 9: Extend doctor and verification coverage

**Files:**
- Modify: `scripts/doctor.mjs`
- Modify: `src/lib/doctor.ts`
- Modify: `src/lib/doctor.test.ts`
- Update docs as needed

- [ ] **Step 1: Write failing doctor tests for multi-user checks**

```ts
test('doctor warns when google-services.json is missing', () => {})
test('doctor reports missing private vault encryption config', () => {})
test('doctor reports invite/reminder config gaps', () => {})
```

- [ ] **Step 2: Run targeted doctor tests**

Run: `npm test -- src/lib/doctor.test.ts`
Expected: FAIL for the new checks

- [ ] **Step 3: Implement minimal doctor coverage additions**

```ts
// add checks for private vault config, shared space config, reminders, auth safety
```

- [ ] **Step 4: Re-run targeted doctor tests**

Run: `npm test -- src/lib/doctor.test.ts`
Expected: PASS

- [ ] **Step 5: Run full doctor workflow**

Run: `npm run doctor`
Expected: PASS or WARN with actionable missing external config only

### Task 10: Final regression and documentation

**Files:**
- Modify: `README.md`
- Modify: any setup docs needed for Firebase, MFA, reminders, and shared spaces

- [ ] **Step 1: Document the new model**

```md
## Personal vs Shared
## MFA setup
## Invites and roles
## Reminders
## Drive links
## Migration notes
```

- [ ] **Step 2: Run final verification**

Run:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run doctor`

Expected: all pass, with only external-config warnings if applicable

- [ ] **Step 3: Prepare integration checkpoint**

```bash
git status
```

Expected: only intended files changed
