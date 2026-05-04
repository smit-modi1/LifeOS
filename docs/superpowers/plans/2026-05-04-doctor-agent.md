# LifeOS Doctor Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-command doctor that audits and safely auto-fixes common web and Android issues for LifeOS.

**Architecture:** A Node script in `scripts/doctor.mjs` will orchestrate web and Android checks, apply conservative fixes, and print a structured summary. The script will expose mode flags through `package.json` so the same implementation supports full, web-only, and android-only runs.

**Tech Stack:** Node.js ESM, npm scripts, Capacitor CLI, Vite, Vitest, ESLint, TypeScript project config inspection.

---

### Task 1: Add failing tests for doctor decision logic

**Files:**
- Create: `src/lib/doctor.test.ts`
- Create: `src/lib/doctor.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {
  detectMissingFirebaseEnvKeys,
  detectMissingGoogleProvider,
  summarizeDoctorResults,
} from './doctor'

test('reports missing Firebase env keys', () => {
  expect(
    detectMissingFirebaseEnvKeys({
      VITE_FIREBASE_API_KEY: 'x',
      VITE_FIREBASE_AUTH_DOMAIN: undefined,
      VITE_FIREBASE_PROJECT_ID: 'x',
      VITE_FIREBASE_APP_ID: undefined,
    }),
  ).toEqual(['VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_APP_ID'])
})

test('reports missing Google provider wiring', () => {
  expect(detectMissingGoogleProvider({ plugins: {} })).toBe(true)
})

test('summary fails when a blocking check fails', () => {
  expect(
    summarizeDoctorResults([
      { status: 'PASS', label: 'lint' },
      { status: 'FAIL', label: 'android sync' },
    ]).status,
  ).toBe('FAIL')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/doctor.test.ts`
Expected: FAIL because `src/lib/doctor.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
export type DoctorStatus = 'PASS' | 'FIXED' | 'WARN' | 'FAIL'

export type DoctorResult = {
  status: DoctorStatus
  label: string
}

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

export const detectMissingFirebaseEnvKeys = (
  env: Record<string, string | undefined>,
) => FIREBASE_ENV_KEYS.filter((key) => !env[key])

export const detectMissingGoogleProvider = (config: Record<string, unknown>) => {
  const plugins =
    config.plugins && typeof config.plugins === 'object'
      ? (config.plugins as Record<string, unknown>)
      : {}
  const auth =
    plugins.FirebaseAuthentication &&
    typeof plugins.FirebaseAuthentication === 'object'
      ? (plugins.FirebaseAuthentication as { providers?: string[] })
      : undefined
  return !auth?.providers?.includes('google.com')
}

export const summarizeDoctorResults = (results: DoctorResult[]) => {
  if (results.some((result) => result.status === 'FAIL')) {
    return { status: 'FAIL' as const }
  }
  if (results.some((result) => result.status === 'WARN')) {
    return { status: 'WARN' as const }
  }
  if (results.some((result) => result.status === 'FIXED')) {
    return { status: 'FIXED' as const }
  }
  return { status: 'PASS' as const }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/doctor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/doctor.ts src/lib/doctor.test.ts
git commit -m "test: add doctor decision logic coverage"
```

### Task 2: Implement the doctor CLI

**Files:**
- Create: `scripts/doctor.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing integration expectation**

```ts
test('summary fails when a blocking check fails', () => {
  expect(
    summarizeDoctorResults([
      { status: 'PASS', label: 'lint' },
      { status: 'FAIL', label: 'android sync' },
    ]).status,
  ).toBe('FAIL')
})
```

- [ ] **Step 2: Run existing tests to keep baseline green**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Write minimal implementation**

```js
const mode = process.argv[2] ?? 'full'
// run web checks for full/web
// run android checks for full/android
// build before cap sync
// print PASS/FIXED/WARN/FAIL lines
// exit 1 if blocking failures remain
```

- [ ] **Step 4: Add npm scripts**

```json
"doctor": "node scripts/doctor.mjs full",
"doctor:web": "node scripts/doctor.mjs web",
"doctor:android": "node scripts/doctor.mjs android"
```

- [ ] **Step 5: Run manual verification**

Run:
- `npm run doctor:web`
- `npm run doctor:android`
- `npm run doctor`

Expected:
- web mode runs lint, test, build
- android mode runs build and capacitor sync plus config checks
- full mode combines both and prints a final summary

- [ ] **Step 6: Commit**

```bash
git add scripts/doctor.mjs package.json
git commit -m "feat: add project doctor command"
```

### Task 3: Document usage and expectations

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation gap**

```md
There is currently no documented single-command debugging workflow.
```

- [ ] **Step 2: Update the README**

```md
## Doctor

Use `npm run doctor` to run the full project health check.

- `npm run doctor:web` checks lint, tests, and build
- `npm run doctor:android` checks Android wiring and runs Capacitor sync
- `npm run doctor` runs both and applies safe auto-fixes where possible
```

- [ ] **Step 3: Run verification**

Run:
- `npm run lint`
- `npm test`
- `npm run build`

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add doctor workflow"
```
