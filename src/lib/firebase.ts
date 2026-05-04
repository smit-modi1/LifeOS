
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
} from 'firebase/firestore'
import { FirebaseError, getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { signInWithCredential } from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import type { LifeOsData, ModuleKey } from '../types/lifeos'
import { shouldRetryGoogleWithLegacyFlow } from './auth'
import { createEmptyLifeOsData, mergeLifeOsData, nowIso } from './lifeos'

type FirebaseEnv = Record<string, string | undefined>

type FirebaseRuntime = {
  app: FirebaseApp
  auth: ReturnType<typeof getAuth>
  db: ReturnType<typeof getFirestore>
}

let runtime: FirebaseRuntime | null = null

export const firebaseConfigFromEnv = (env: FirebaseEnv) => {
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }

  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    return null
  }

  return config
}

export const isFirebaseConfigured = (env: FirebaseEnv) => firebaseConfigFromEnv(env) !== null

export const getFirebaseRuntime = (env: FirebaseEnv): FirebaseRuntime | null => {
  if (runtime) {
    return runtime
  }

  const config = firebaseConfigFromEnv(env)

  if (!config) {
    return null
  }

  const app = getApps().length ? getApp() : initializeApp(config)
  const db = getApps().length === 1 && runtime
    ? getFirestore(app)
    : initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  const auth = getAuth(app)

  if (typeof window !== 'undefined') {
    void setPersistence(auth, browserLocalPersistence).catch(() => undefined)
  }

  runtime = { app, auth, db }
  return runtime
}

export const watchAuth = (
  env: FirebaseEnv,
  listener: (user: User | null) => void,
) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    listener(null)
    return () => undefined
  }

  return onAuthStateChanged(current.auth, listener)
}

export const signInWithGoogle = async (env: FirebaseEnv) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    throw new Error('Firebase is not configured.')
  }

  if (Capacitor.isNativePlatform()) {
    let result
    try {
      result = await FirebaseAuthentication.signInWithGoogle()
    } catch (error) {
      if (!shouldRetryGoogleWithLegacyFlow(error)) {
        throw error
      }

      result = await FirebaseAuthentication.signInWithGoogle({
        useCredentialManager: false,
      })
    }

    if (result.credential?.idToken) {
      const credential = GoogleAuthProvider.credential(result.credential.idToken)
      await signInWithCredential(current.auth, credential)
    } else {
      throw new Error('Google Sign-In failed: No ID token returned.')
    }
  } else {
    const provider = new GoogleAuthProvider()
    // Use redirect for both web and native — popups are blocked by most browsers
    await signInWithRedirect(current.auth, provider)
  }
}

export const getGoogleRedirectResult = async (env: FirebaseEnv) => {
  const current = getFirebaseRuntime(env)
  if (!current) return null
  try {
    const result = await getRedirectResult(current.auth)
    return result
  } catch {
    return null
  }
}

export const signInWithEmail = async (
  env: FirebaseEnv,
  email: string,
  password: string,
) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    throw new Error('Firebase is not configured.')
  }

  await signInWithEmailAndPassword(current.auth, email, password)
}

export const signUpWithEmail = async (
  env: FirebaseEnv,
  email: string,
  password: string,
) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    throw new Error('Firebase is not configured.')
  }

  await createUserWithEmailAndPassword(current.auth, email, password)
}

export const signOutUser = async (env: FirebaseEnv) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    return
  }

  await signOut(current.auth)
}

const moduleRef = (db: FirebaseRuntime['db'], userId: string, key: ModuleKey) => {
  if (key === 'profile') {
    return doc(db, 'users', userId, 'profile', 'main')
  }

  return doc(db, 'users', userId, 'modules', key)
}

export const loadFirebaseData = async (
  env: FirebaseEnv,
  userId: string,
): Promise<LifeOsData> => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    return createEmptyLifeOsData()
  }

  const next = createEmptyLifeOsData()
  const profileSnapshot = await getDoc(moduleRef(current.db, userId, 'profile'))
  const keys: ModuleKey[] = [
    'work',
    'habits',
    'skills',
    'wealth',
    'learning',
    'reading',
    'notes',
    'family',
    'wishes',
  ]
  const snapshots = await Promise.all(
    keys.map(async (key) => [key, await getDoc(moduleRef(current.db, userId, key))] as const),
  )

  if (profileSnapshot.exists()) {
    next.profile = mergeLifeOsData({ profile: profileSnapshot.data().data }).profile
  }

  for (const [key, snapshot] of snapshots) {
    if (snapshot.exists()) {
      switch (key) {
        case 'work':
          next.work = mergeLifeOsData({ work: snapshot.data().data }).work
          break
        case 'habits':
          next.habits = mergeLifeOsData({ habits: snapshot.data().data }).habits
          break
        case 'skills':
          next.skills = mergeLifeOsData({ skills: snapshot.data().data }).skills
          break
        case 'wealth':
          next.wealth = mergeLifeOsData({ wealth: snapshot.data().data }).wealth
          break
        case 'learning':
          next.learning = mergeLifeOsData({ learning: snapshot.data().data }).learning
          break
        case 'reading':
          next.reading = mergeLifeOsData({ reading: snapshot.data().data }).reading
          break
        case 'notes':
          next.notes = mergeLifeOsData({ notes: snapshot.data().data }).notes
          break
        case 'family':
          next.family = mergeLifeOsData({ family: snapshot.data().data }).family
          break
        case 'wishes':
          next.wishes = mergeLifeOsData({ wishes: snapshot.data().data }).wishes
          break
      }
    }
  }

  return next
}

export const saveFirebaseModule = async <K extends ModuleKey>(
  env: FirebaseEnv,
  userId: string,
  key: K,
  data: LifeOsData[K],
) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    return
  }

  await Promise.all([
    setDoc(
      moduleRef(current.db, userId, key),
      { data, updatedAt: nowIso() },
      { merge: true },
    ),
    setDoc(
      doc(current.db, 'users', userId),
      { updatedAt: nowIso() },
      { merge: true },
    ),
  ])
}

export const saveFirebasePath = async (
  env: FirebaseEnv,
  path: string,
  data: unknown,
) => {
  const current = getFirebaseRuntime(env)

  if (!current) {
    return
  }

  const segments = path.split('/').filter(Boolean)
  if (segments.length % 2 !== 0) {
    throw new Error(`Invalid Firestore document path: ${path}`)
  }

  await setDoc(
    doc(current.db, segments[0], ...segments.slice(1)),
    { data, updatedAt: nowIso() },
    { merge: true },
  )
}

export const getFirebaseMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while talking to Firebase.'
}
