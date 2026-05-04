import type { LifeOsData, ModuleKey } from '../types/lifeos'
import type { ModuleWriter } from './private-vault-repository'

const PRIVATE_ONLY_MODULES: ModuleKey[] = ['profile', 'wealth', 'notes', 'wishes']

export class SharedSpaceRepository {
  private writeModule: ModuleWriter

  constructor(writeModule: ModuleWriter) {
    this.writeModule = writeModule
  }

  async saveModule<K extends ModuleKey>(spaceId: string, key: K, data: LifeOsData[K]) {
    if (PRIVATE_ONLY_MODULES.includes(key)) {
      throw new Error(`${key} cannot be saved to a shared space.`)
    }

    await this.writeModule(`spaces/${spaceId}/modules/${key}`, data)
  }
}
