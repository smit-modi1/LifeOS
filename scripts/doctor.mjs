import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const rootDir = process.cwd()
const mode = process.argv[2] ?? 'full'

const results = []
const commandsRun = []
const npmExecPath = process.env.npm_execpath
const capCliPath = resolve(rootDir, 'node_modules', '@capacitor', 'cli', 'bin', 'capacitor')

const envPath = resolve(rootDir, '.env')
const capacitorConfigPath = resolve(rootDir, 'capacitor.config.ts')
const googleServicesPath = resolve(rootDir, 'android', 'app', 'google-services.json')
const androidAppPath = resolve(rootDir, 'android', 'app')

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]

const addResult = (status, label, detail) => {
  results.push({ status, label, detail })
}

const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '')

const parseEnvFile = (text) => {
  const entries = {}
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const index = line.indexOf('=')
    if (index === -1) continue
    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim()
    entries[key] = value
  }
  return entries
}

const runCommand = (label, command, args) => {
  commandsRun.push(`${command} ${args.join(' ')}`.trim())

  let executable = command
  let nextArgs = args

  if (command === 'npm.cmd' && npmExecPath) {
    executable = process.execPath
    nextArgs = [npmExecPath, ...args]
  } else if (command === 'npx.cmd' && existsSync(capCliPath) && args[0] === 'cap') {
    executable = process.execPath
    nextArgs = [capCliPath, ...args.slice(1)]
  }

  const result = spawnSync(executable, nextArgs, {
    cwd: rootDir,
    encoding: 'utf8',
  })

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
    status: result.status ?? 1,
    error: result.error?.message ?? '',
    label,
  }
}

const detectMissingFirebaseEnvKeys = (env) =>
  FIREBASE_ENV_KEYS.filter((key) => !env[key])

const hasGoogleProvider = (text) =>
  /FirebaseAuthentication\s*:\s*\{[\s\S]*providers\s*:\s*\[[\s\S]*['"]google\.com['"]/m.test(text)

const summarizeStatus = () => {
  if (results.some((result) => result.status === 'FAIL')) return 'FAIL'
  if (results.some((result) => result.status === 'WARN')) return 'WARN'
  if (results.some((result) => result.status === 'FIXED')) return 'FIXED'
  return 'PASS'
}

const runWebChecks = () => {
  for (const [label, command, args] of [
    ['lint', 'npm.cmd', ['run', 'lint']],
    ['test', 'npm.cmd', ['test']],
    ['build', 'npm.cmd', ['run', 'build']],
  ]) {
    const result = runCommand(label, command, args)
    if (result.ok) {
      addResult('PASS', label, `${label} passed`)
    } else {
      const detail = result.stderr || result.stdout || result.error || `${label} failed`
      addResult('FAIL', label, detail)
    }
  }
}

const runAndroidChecks = () => {
  const env = parseEnvFile(readText(envPath))
  const missingKeys = detectMissingFirebaseEnvKeys(env)
  if (missingKeys.length > 0) {
    addResult('WARN', 'firebase env', `Missing keys: ${missingKeys.join(', ')}`)
  } else {
    addResult('PASS', 'firebase env', 'Firebase env keys present')
  }

  const capacitorConfigText = readText(capacitorConfigPath)
  if (!hasGoogleProvider(capacitorConfigText)) {
    addResult('FAIL', 'firebase auth provider', 'capacitor.config.ts is missing google.com provider wiring')
  } else {
    addResult('PASS', 'firebase auth provider', 'Google provider wiring present')
  }

  if (!existsSync(androidAppPath)) {
    addResult('FAIL', 'android project', 'android/app is missing')
    return
  }

  if (!existsSync(googleServicesPath)) {
    addResult('WARN', 'google-services.json', 'android/app/google-services.json is missing')
  } else {
    addResult('PASS', 'google-services.json', 'google-services.json present')
  }

  const buildResult = runCommand('android build prep', 'npm.cmd', ['run', 'build'])
  if (!buildResult.ok) {
    const detail = buildResult.stderr || buildResult.stdout || buildResult.error || 'build failed before Android sync'
    addResult('FAIL', 'android build prep', detail)
    return
  }
  addResult('FIXED', 'android build prep', 'Rebuilt dist before Android sync')

  const syncResult = runCommand('android sync', 'npx.cmd', ['cap', 'sync', 'android'])
  if (!syncResult.ok) {
    const detail = syncResult.stderr || syncResult.stdout || syncResult.error || 'Capacitor sync failed'
    addResult('FAIL', 'android sync', detail)
    return
  }
  addResult('FIXED', 'android sync', 'Capacitor Android sync completed')
}

if (mode === 'web' || mode === 'full') {
  runWebChecks()
}

if (mode === 'android' || mode === 'full') {
  runAndroidChecks()
}

const finalStatus = summarizeStatus()

console.log(`Doctor mode: ${mode}`)
for (const result of results) {
  console.log(`[${result.status}] ${result.label}: ${result.detail}`)
}
console.log(`Final status: ${finalStatus}`)
if (commandsRun.length) {
  console.log('Commands run:')
  for (const command of commandsRun) {
    console.log(`- ${command}`)
  }
}

process.exit(finalStatus === 'FAIL' ? 1 : 0)
