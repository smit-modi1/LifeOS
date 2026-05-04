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
] as const

export const detectMissingFirebaseEnvKeys = (
  env: Record<string, string | undefined>,
) => FIREBASE_ENV_KEYS.filter((key) => !env[key])

export const detectMissingGoogleProvider = (
  config: Record<string, unknown>,
) => {
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
