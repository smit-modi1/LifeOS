import capacitorConfig from '../../capacitor.config'
import {
  getAuthValidationMessage,
  shouldRetryGoogleWithLegacyFlow,
} from './auth'

test('requires both email and password before attempting sign in', () => {
  expect(getAuthValidationMessage('signin', { email: '', password: '' })).toBe(
    'Enter your email and password.',
  )
})

test('requires a longer password when creating an account', () => {
  expect(
    getAuthValidationMessage('signup', { email: 'user@example.com', password: '12345' }),
  ).toBe('Use at least 6 characters for your password.')
})

test('allows valid sign-in credentials', () => {
  expect(
    getAuthValidationMessage('signin', {
      email: 'user@example.com',
      password: 'correct horse battery staple',
    }),
  ).toBeNull()
})

test('retries native Google auth with the legacy flow on credential-manager errors', () => {
  expect(
    shouldRetryGoogleWithLegacyFlow(new Error("Your device doesn't support credential manager.")),
  ).toBe(true)
})

test('does not retry native Google auth for unrelated failures', () => {
  expect(shouldRetryGoogleWithLegacyFlow(new Error('Network request failed.'))).toBe(false)
})

test('capacitor config loads Google for native Firebase auth', () => {
  expect(capacitorConfig.plugins?.FirebaseAuthentication?.providers).toContain('google.com')
})
