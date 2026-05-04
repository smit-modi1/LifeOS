import type { LifeOsData } from '../types/lifeos'

export type LegacyMigrationResult = {
  userId: string
  privateModules: Pick<LifeOsData, 'profile' | 'wealth' | 'notes' | 'wishes'>
  personalModules: Pick<LifeOsData, 'work' | 'habits' | 'skills' | 'learning' | 'reading' | 'family'>
  sharedSpaces: []
}

export const migrateLegacyLifeOsData = (
  legacy: LifeOsData,
  userId: string,
): LegacyMigrationResult => ({
  userId,
  privateModules: {
    profile: legacy.profile,
    wealth: legacy.wealth,
    notes: legacy.notes,
    wishes: legacy.wishes,
  },
  personalModules: {
    work: legacy.work,
    habits: legacy.habits,
    skills: legacy.skills,
    learning: legacy.learning,
    reading: legacy.reading,
    family: legacy.family,
  },
  sharedSpaces: [],
})
