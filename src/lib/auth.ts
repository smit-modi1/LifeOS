type AuthIntent = 'signin' | 'signup' | 'google'

type Credentials = {
  email: string
  password: string
}

const CREDENTIAL_MANAGER_PATTERNS = [
  'credential manager',
  'no provider dependencies found',
]

export const getAuthValidationMessage = (
  intent: AuthIntent,
  credentials?: Credentials,
) => {
  if (intent === 'google') {
    return null
  }

  const email = credentials?.email?.trim() ?? ''
  const password = credentials?.password ?? ''

  if (!email || !password) {
    return 'Enter your email and password.'
  }

  if (intent === 'signup' && password.length < 6) {
    return 'Use at least 6 characters for your password.'
  }

  return null
}

export const shouldRetryGoogleWithLegacyFlow = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return CREDENTIAL_MANAGER_PATTERNS.some((pattern) => message.includes(pattern))
}
