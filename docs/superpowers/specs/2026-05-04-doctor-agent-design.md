# LifeOS Doctor Agent Design

## Goal

Add a single command that can test, diagnose, and safely auto-fix common web and Android app issues in the LifeOS project.

## Scope

The doctor command should:
- run web verification commands
- inspect Firebase and auth configuration
- inspect Capacitor and Android project wiring
- apply safe auto-fixes
- print a clear summary of checks, fixes, warnings, and blockers

The doctor command should not:
- modify secrets
- invent missing Firebase credentials
- delete user data
- make destructive filesystem changes

## Recommended Approach

Use a Node script at `scripts/doctor.mjs` as the single orchestrator behind:
- `npm run doctor`
- `npm run doctor:web`
- `npm run doctor:android`

This keeps the logic readable, testable, and easy to extend when new app checks are added.

## Architecture

### Command entrypoints

`package.json` will expose three doctor commands. They all call the same script with mode flags:
- full
- web
- android

### Doctor responsibilities

The script will:
1. load the project root and key files
2. validate expected files and config patterns
3. run verification commands
4. apply safe repairs
5. rerun key checks when a fix was applied
6. print a structured report and exit non-zero when blockers remain

### Safe auto-fixes

The first version should only perform fixes that are deterministic and low risk:
- run `npm run build` before Android sync so `dist` is fresh
- run `npx cap sync android` when Android project files exist
- detect missing Google provider wiring in Capacitor config and report it
- detect missing Firebase env keys and report them
- detect missing `android/app/google-services.json` and report it
- detect missing auth tests or failing verification and report them

### Reporting model

Each check should emit one of:
- `PASS`
- `FIXED`
- `WARN`
- `FAIL`

The final summary should include:
- commands run
- fixes applied
- blockers remaining
- recommended next actions

## Files

### New

- `scripts/doctor.mjs`
- `src/lib/doctor.test.ts`

### Modified

- `package.json`
- `README.md`
- optionally `src/test/setup.ts` if test helpers are needed

## Testing

The doctor logic should be split enough to test decision-making without shelling out for every case. Unit tests should cover:
- Firebase env validation
- Android config validation
- summary severity selection
- fix planning behavior

Manual verification should cover:
- `npm run doctor:web`
- `npm run doctor:android`
- `npm run doctor`

## Risks

- Android tooling may fail on machines without SDK/JDK setup, so the doctor must downgrade some problems to actionable blockers instead of crashing without context.
- Auto-fix must stay conservative. If a repair is uncertain, report instead of mutating.

## Success Criteria

- one command checks both web and Android app health
- common safe repairs happen automatically
- login/auth configuration regressions are surfaced clearly
- the command is stable enough to use as the default debugging entry point
