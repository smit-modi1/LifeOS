import type { LifeOsData, ModuleKey } from '../types/lifeos'
import { STORAGE_KEY, createEmptyLifeOsData, mergeLifeOsData } from './lifeos'
import { isFirebaseConfigured, loadFirebaseData, saveFirebaseModule } from './firebase'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface LifeOsRepository {
  kind: 'local' | 'firebase'
  isConfigured: boolean
  load(userId: string): Promise<LifeOsData>
  saveModule<K extends ModuleKey>(userId: string, key: K, data: LifeOsData[K]): Promise<void>
}

const browserStorage = (): StorageLike | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export class LocalLifeOsRepository implements LifeOsRepository {
  kind = 'local' as const
  isConfigured = true
  private storageKey: string
  private storage: StorageLike | null

  constructor(storageKey = STORAGE_KEY, storage: StorageLike | null = browserStorage()) {
    this.storageKey = storageKey
    this.storage = storage
  }

  async load(userId = 'local'): Promise<LifeOsData> {
    void userId
    const raw = this.storage?.getItem(this.storageKey)

    if (!raw) {
      return createEmptyLifeOsData()
    }

    try {
      return mergeLifeOsData(JSON.parse(raw) as Partial<LifeOsData>)
    } catch {
      return createEmptyLifeOsData()
    }
  }

  async saveModule<K extends ModuleKey>(userId: string, key: K, data: LifeOsData[K]) {
    void userId
    const current = await this.load()
    const next = { ...current, [key]: data }
    this.storage?.setItem(this.storageKey, JSON.stringify(next))
  }
}

export class FirebaseLifeOsRepository implements LifeOsRepository {
  kind = 'firebase' as const
  isConfigured: boolean
  private env: Record<string, string | undefined>

  constructor(env: Record<string, string | undefined>) {
    this.env = env
    this.isConfigured = isFirebaseConfigured(env)
  }

  async load(userId: string) {
    return loadFirebaseData(this.env, userId)
  }

  async saveModule<K extends ModuleKey>(userId: string, key: K, data: LifeOsData[K]) {
    await saveFirebaseModule(this.env, userId, key, data)
  }
}
