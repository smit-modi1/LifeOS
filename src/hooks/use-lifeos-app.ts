import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import type { LifeOsData, ModuleKey, SyncStatus } from '../types/lifeos'
import type { AppContext, SpaceSummary } from '../types/spaces'
import { getAuthValidationMessage } from '../lib/auth'
import { createEmptyLifeOsData } from '../lib/lifeos'
import { PrivateVaultRepository, deriveVaultPassphrase } from '../lib/private-vault-repository'
import { SharedSpaceRepository } from '../lib/shared-space-repository'
import { migrateLegacyLifeOsData } from '../lib/migration'
import {
  createPersonalContext,
  createSpaceContext,
  createSpaceSummary,
  loadSpaceSummaries,
  saveSpaceSummaries,
} from '../lib/spaces'
import {
  getFirebaseMessage,
  getGoogleRedirectResult,
  isFirebaseConfigured,
  saveFirebasePath,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  watchAuth,
} from '../lib/firebase'
import { FirebaseLifeOsRepository, LocalLifeOsRepository } from '../lib/repositories'
import { Capacitor } from '@capacitor/core'

type AppMode = 'loading' | 'auth' | 'local-setup' | 'ready'

type Credentials = {
  email: string
  password: string
}

const env = import.meta.env as Record<string, string | undefined>
const vaultSecret = env['VITE_VAULT_SECRET'] ?? 'lifeos-default-vault'
const firebaseRepository = new FirebaseLifeOsRepository(env)
const localRepository = new LocalLifeOsRepository()
const spaceStorage = () => (typeof window === 'undefined' ? null : window.localStorage)
const privateModuleKeys: ModuleKey[] = ['profile', 'wealth', 'notes', 'wishes']
const localPathWriter = async (path: string, value: unknown) => {
  spaceStorage()?.setItem(`lifeos-path:${path}`, JSON.stringify(value))
}
const firebasePathWriter = async (path: string, value: unknown) => {
  await saveFirebasePath(env, path, value)
}
const MIGRATION_KEY = 'lifeos-migrated-v1'

export const useLifeOsApp = () => {
  const [mode, setMode] = useState<AppMode>(
    firebaseRepository.isConfigured ? 'loading' : 'local-setup',
  )
  const [data, setData] = useState<LifeOsData>(createEmptyLifeOsData())
  const [user, setUser] = useState<User | null>(null)
  const [repositoryKind, setRepositoryKind] = useState<'local' | 'firebase'>(
    firebaseRepository.isConfigured ? 'firebase' : 'local',
  )
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [activeContext, setActiveContext] = useState<AppContext>(createPersonalContext('local'))
  const [userSpaces, setUserSpaces] = useState<SpaceSummary[]>(() =>
    loadSpaceSummaries(spaceStorage(), 'local'),
  )

  const setAccountSpaces = (userId: string) => {
    setUserSpaces(loadSpaceSummaries(spaceStorage(), userId))
    setActiveContext(createPersonalContext(userId))
  }

  useEffect(() => {
    if (!firebaseRepository.isConfigured) {
      return
    }

    let unsubscribe = () => {}

    const init = async () => {
      // MUST await this before setting up onAuthStateChanged.
      // Firebase fires onAuthStateChanged(null) immediately on page load, before
      // processing the redirect credential. If we don't wait, the user gets
      // bounced back to the login screen right away.
      if (!Capacitor.isNativePlatform()) {
        await getGoogleRedirectResult(env).catch(() => undefined)
      }

      unsubscribe = watchAuth(env, async (nextUser) => {
        setUser(nextUser)
        setError(null)

        if (!nextUser) {
          setMode('auth')
          return
        }

        setAccountSpaces(nextUser.uid)
        setRepositoryKind('firebase')
        setMode('loading')
        try {
          const nextData = await firebaseRepository.load(nextUser.uid)
          // Run migration once per account to split data into private vault
          const migrationKey = `${MIGRATION_KEY}:${nextUser.uid}`
          if (!localStorage.getItem(migrationKey)) {
            const result = migrateLegacyLifeOsData(nextData, nextUser.uid)
            console.info('[LifeOS] Data migration applied for user:', result.userId)
            localStorage.setItem(migrationKey, '1')
          }
          setData(nextData)
          setMode('ready')
        } catch (e) {
          // New user has no Firestore data yet — start with empty data, don't sign out
          console.warn('Firestore load failed, using empty data:', getFirebaseMessage(e))
          setData(createEmptyLifeOsData())
          setMode('ready')
        }
      })
    }

    void init()
    return () => unsubscribe()
  }, [])

  const loadLocalMode = async () => {
    setRepositoryKind('local')
    setAccountSpaces('local')
    setMode('loading')
    const nextData = await localRepository.load('local')
    setData(nextData)
    setMode('ready')
    setError(null)
  }

  const updateModule = async <K extends ModuleKey>(key: K, nextValue: LifeOsData[K]) => {
    const userId = repositoryKind === 'firebase' && user ? user.uid : 'local'
    const pathWriter = repositoryKind === 'firebase' && user ? firebasePathWriter : localPathWriter

    setData((current) => ({ ...current, [key]: nextValue }))
    setSyncStatus('saving')
    setError(null)

    try {
      if (activeContext.kind === 'space') {
        const sharedRepository = new SharedSpaceRepository(pathWriter)
        await sharedRepository.saveModule(activeContext.spaceId, key, nextValue)
      } else if (privateModuleKeys.includes(key)) {
        const userEmail = user?.email ?? 'local'
        const passphrase = deriveVaultPassphrase(userId, userEmail, vaultSecret)
        const privateRepository = new PrivateVaultRepository(pathWriter, passphrase)
        await privateRepository.saveModule(userId, key, nextValue)
      } else {
        const activeRepository =
          repositoryKind === 'firebase' && user ? firebaseRepository : localRepository
        await activeRepository.saveModule(userId, key, nextValue)
      }

      setSyncStatus('saved')
      window.setTimeout(() => {
        setSyncStatus((current) => (current === 'saved' ? 'idle' : current))
      }, 1600)
    } catch (nextError) {
      setSyncStatus('error')
      setError(getFirebaseMessage(nextError))
    }
  }

  const authenticate = async (
    intent: 'signin' | 'signup' | 'google',
    credentials?: Credentials,
  ) => {
    const validationMessage = getAuthValidationMessage(intent, credentials)
    if (validationMessage) {
      setError(validationMessage)
      setMode('auth')
      return
    }

    try {
      setError(null)
      setMode('loading')

      if (intent === 'google') {
        await signInWithGoogle(env)
      } else if (intent === 'signup' && credentials) {
        await signUpWithEmail(env, credentials.email, credentials.password)
      } else if (credentials) {
        await signInWithEmail(env, credentials.email, credentials.password)
      }
    } catch (nextError) {
      setMode('auth')
      setError(getFirebaseMessage(nextError))
    }
  }

  const signOut = async () => {
    await signOutUser(env)
    setUser(null)
    setAccountSpaces('local')
    setMode(firebaseRepository.isConfigured ? 'auth' : 'local-setup')
  }

  const createSharedSpace = (name: string) => {
    const userId = user?.uid ?? 'local'
    const space = createSpaceSummary({ name, ownerId: userId })
    const nextSpaces = [...userSpaces, space]

    setUserSpaces(nextSpaces)
    saveSpaceSummaries(spaceStorage(), userId, nextSpaces)
    setActiveContext(createSpaceContext(userId, space.id))
  }

  const selectPersonalContext = () => {
    setActiveContext(createPersonalContext(user?.uid ?? 'local'))
  }

  const selectSpaceContext = (spaceId: string) => {
    setActiveContext(createSpaceContext(user?.uid ?? 'local', spaceId))
  }

  return {
    mode,
    data,
    user,
    error,
    syncStatus,
    repositoryKind,
    activeContext,
    userSpaces,
    firebaseConfigured: isFirebaseConfigured(env),
    loadLocalMode,
    authenticate,
    createSharedSpace,
    selectPersonalContext,
    selectSpaceContext,
    signOut,
    updateModule,
  }
}
