import { useEffect, useState } from 'react'
import type { User } from 'firebase/auth'
import type { LifeOsData, ModuleKey, SyncStatus } from '../types/lifeos'
import { createEmptyLifeOsData } from '../lib/lifeos'
import {
  getFirebaseMessage,
  getGoogleRedirectResult,
  isFirebaseConfigured,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  watchAuth,
} from '../lib/firebase'
import { FirebaseLifeOsRepository, LocalLifeOsRepository } from '../lib/repositories'

type AppMode = 'loading' | 'auth' | 'local-setup' | 'ready'

type Credentials = {
  email: string
  password: string
}

const env = import.meta.env as Record<string, string | undefined>
const firebaseRepository = new FirebaseLifeOsRepository(env)
const localRepository = new LocalLifeOsRepository()

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

  useEffect(() => {
    if (!firebaseRepository.isConfigured) {
      return
    }

    // Capture Google redirect result on page load (after Google auth redirect)
    void getGoogleRedirectResult(env).catch(() => undefined)

    return watchAuth(env, async (nextUser) => {
      setUser(nextUser)
      setError(null)

      if (!nextUser) {
        setMode('auth')
        return
      }

      setRepositoryKind('firebase')
      setMode('loading')
      try {
        const nextData = await firebaseRepository.load(nextUser.uid)
        setData(nextData)
        setMode('ready')
      } catch (e) {
        setError(getFirebaseMessage(e) + " (Check Firebase Firestore rules)")
        await signOutUser(env)
        setMode('auth')
      }
    })
  }, [])

  const loadLocalMode = async () => {
    setRepositoryKind('local')
    setMode('loading')
    const nextData = await localRepository.load('local')
    setData(nextData)
    setMode('ready')
    setError(null)
  }

  const updateModule = async <K extends ModuleKey>(key: K, nextValue: LifeOsData[K]) => {
    const activeRepository =
      repositoryKind === 'firebase' && user ? firebaseRepository : localRepository
    const userId = repositoryKind === 'firebase' && user ? user.uid : 'local'

    setData((current) => ({ ...current, [key]: nextValue }))
    setSyncStatus('saving')
    setError(null)

    try {
      await activeRepository.saveModule(userId, key, nextValue)
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
    setMode(firebaseRepository.isConfigured ? 'auth' : 'local-setup')
  }

  return {
    mode,
    data,
    user,
    error,
    syncStatus,
    repositoryKind,
    firebaseConfigured: isFirebaseConfigured(env),
    loadLocalMode,
    authenticate,
    signOut,
    updateModule,
  }
}
