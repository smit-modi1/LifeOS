import type {
  BaseRecord,
  DashboardStat,
  HabitCadence,
  LifeOsData,
  ModuleKey,
  ReadingCategory,
  SkillBucket,
} from '../types/lifeos'

export const READING_CATEGORIES: ReadingCategory[] = [
  'Business',
  'Startup',
  'Finance',
  'Geo-politics',
  'Self-development',
  'History',
]

export const SECTION_META: Array<{
  id: 'dashboard' | ModuleKey
  label: string
  icon: string
}> = [
  { id: 'dashboard', label: 'Overview', icon: '◈' },
  { id: 'profile', label: 'Profile', icon: '◎' },
  { id: 'work', label: 'Work', icon: '▣' },
  { id: 'habits', label: 'Habits', icon: '◉' },
  { id: 'skills', label: 'Skills', icon: '◆' },
  { id: 'wealth', label: 'Wealth', icon: '◌' },
  { id: 'learning', label: 'Learning', icon: '◐' },
  { id: 'reading', label: 'Reading', icon: '◧' },
  { id: 'notes', label: 'Notes', icon: '◫' },
  { id: 'family', label: 'Responsibilities', icon: '◑' },
  { id: 'wishes', label: 'Wish List', icon: '✦' },
]

export const STORAGE_KEY = 'lifeos-mobile-v1'

export const todayKey = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const nowIso = () => new Date().toISOString()

export const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 12)
}

export const createRecord = <T extends object>(fields: T): T & BaseRecord => ({
  ...fields,
  id: createId(),
  createdAt: nowIso(),
  updatedAt: nowIso(),
})

export const updateRecord = <T extends BaseRecord>(
  record: T,
  patch: Partial<T>,
): T => {
  const nextTimestamp = nowIso()
  const updatedAt =
    nextTimestamp === record.updatedAt
      ? new Date(Date.parse(record.updatedAt) + 1).toISOString()
      : nextTimestamp

  return {
    ...record,
    ...patch,
    updatedAt,
  }
}

export const createEmptyLifeOsData = (): LifeOsData => ({
  profile: {
    fullName: '',
    headline: '',
    summary: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    experience: [],
    education: [],
    certifications: [],
    coreSkills: [],
    links: [],
  },
  work: { projects: [] },
  habits: { daily: [], weekly: [], monthly: [], quarterly: [], yearly: [] },
  skills: { goodAt: [], workingOn: [], wantToLearn: [] },
  wealth: { investments: [], expenses: [] },
  learning: { current: [], wishlist: [] },
  reading: {
    current: [],
    wishlist: {
      Business: [],
      Startup: [],
      Finance: [],
      'Geo-politics': [],
      'Self-development': [],
      History: [],
    },
  },
  notes: { items: [] },
  family: { members: [] },
  wishes: { items: [] },
})

export const mergeLifeOsData = (input: Partial<LifeOsData> | null | undefined): LifeOsData => {
  const fallback = createEmptyLifeOsData()

  if (!input) {
    return fallback
  }

  return {
    profile: { ...fallback.profile, ...input.profile },
    work: { ...fallback.work, ...input.work },
    habits: { ...fallback.habits, ...input.habits },
    skills: { ...fallback.skills, ...input.skills },
    wealth: { ...fallback.wealth, ...input.wealth },
    learning: { ...fallback.learning, ...input.learning },
    reading: {
      current: input.reading?.current ?? fallback.reading.current,
      wishlist: { ...fallback.reading.wishlist, ...input.reading?.wishlist },
    },
    notes: { ...fallback.notes, ...input.notes },
    family: { ...fallback.family, ...input.family },
    wishes: { ...fallback.wishes, ...input.wishes },
  }
}

export const setArrayItem = <T extends BaseRecord>(
  items: T[],
  id: string,
  patch: Partial<T>,
): T[] => items.map((item) => (item.id === id ? updateRecord(item, patch) : item))

export const removeArrayItem = <T extends BaseRecord>(items: T[], id: string): T[] =>
  items.filter((item) => item.id !== id)

export const toggleHabitDate = (
  dates: string[],
  dateKey: string,
): string[] => (dates.includes(dateKey)
  ? dates.filter((value) => value !== dateKey)
  : [...dates, dateKey])

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

export const calculateDashboardStats = (data: LifeOsData): DashboardStat[] => {
  const habits = [
    ...data.habits.daily,
    ...data.habits.weekly,
    ...data.habits.monthly,
    ...data.habits.quarterly,
    ...data.habits.yearly,
  ]
  const habitTicks = habits.filter((habit) => habit.completedDates.includes(todayKey())).length
  const skillsMapped =
    data.skills.goodAt.length +
    data.skills.workingOn.length +
    data.skills.wantToLearn.length
  const invested = data.wealth.investments.reduce(
    (sum, item) => sum + (Number.parseFloat(item.value) || 0),
    0,
  )
  const completedWishes = data.wishes.items.filter((item) => item.done).length

  return [
    {
      id: 'work',
      label: 'Active Projects',
      value: data.work.projects.filter((project) => project.status === 'Active').length,
      sublabel: `${data.work.projects.length} total tracked`,
    },
    {
      id: 'habits',
      label: 'Habits Today',
      value: `${habitTicks}/${habits.length}`,
      sublabel: 'marked complete',
    },
    {
      id: 'skills',
      label: 'Skills Mapped',
      value: skillsMapped,
      sublabel: 'strengths and growth areas',
    },
    {
      id: 'wealth',
      label: 'Portfolio',
      value: formatCurrency(invested),
      sublabel: 'currently invested',
    },
    {
      id: 'learning',
      label: 'Courses Active',
      value: data.learning.current.length,
      sublabel: 'learning in progress',
    },
    {
      id: 'reading',
      label: 'Books',
      value: data.reading.current.length,
      sublabel: 'currently reading',
    },
    {
      id: 'wishes',
      label: 'Wish Progress',
      value: `${completedWishes}/${data.wishes.items.length}`,
      sublabel: 'fulfilled wishes',
    },
  ]
}

export const skillTabs: Array<{ id: SkillBucket; label: string }> = [
  { id: 'goodAt', label: 'Good At' },
  { id: 'workingOn', label: 'Working On' },
  { id: 'wantToLearn', label: 'Future Learn' },
]

export const habitTabs: Array<{ id: HabitCadence; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]
