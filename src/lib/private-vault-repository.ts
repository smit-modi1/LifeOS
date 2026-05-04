import type { LifeOsData, ModuleKey } from '../types/lifeos'
import { encryptPrivatePayload, decryptPrivatePayload } from './crypto'
import type { PrivatePayloadEnvelope } from './crypto'

export type ModuleWriter = (path: string, value: unknown) => Promise<void>
export type ModuleReader = (path: string) => Promise<unknown>

const PRIVATE_MODULE_KEYS: ModuleKey[] = ['profile', 'wealth', 'notes', 'wishes']

export const isPrivateModule = (key: ModuleKey): boolean =>
  PRIVATE_MODULE_KEYS.includes(key)

export const deriveVaultPassphrase = (
  userId: string,
  email: string,
  vaultSecret: string,
): string => `${vaultSecret}::${userId}::${email}`

export class PrivateVaultRepository {
  private writeModule: ModuleWriter
  private passphrase: string | null

  constructor(writeModule: ModuleWriter, passphrase: string | null = null) {
    this.writeModule = writeModule
    this.passphrase = passphrase
  }

  async saveModule<K extends ModuleKey>(userId: string, key: K, data: LifeOsData[K]) {
    if (this.passphrase) {
      const envelope = await encryptPrivatePayload(data, this.passphrase)
      await this.writeModule(`users/${userId}/private/${key}`, envelope)
    } else {
      await this.writeModule(`users/${userId}/private/${key}`, data)
    }
  }

  async loadModule<K extends ModuleKey>(
    reader: ModuleReader,
    userId: string,
    key: K,
  ): Promise<LifeOsData[K] | null> {
    const raw = await reader(`users/${userId}/private/${key}`)
    if (!raw) return null
    if (this.passphrase && typeof raw === 'object' && raw !== null && 'ciphertext' in raw) {
      return decryptPrivatePayload<LifeOsData[K]>(raw as PrivatePayloadEnvelope, this.passphrase)
    }
    return raw as LifeOsData[K]
  }
}
