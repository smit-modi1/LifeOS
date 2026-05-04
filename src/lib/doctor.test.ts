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
