export type SectionId =
  | 'dashboard'
  | 'profile'
  | 'work'
  | 'habits'
  | 'skills'
  | 'wealth'
  | 'learning'
  | 'reading'
  | 'notes'
  | 'family'
  | 'wishes'
  | 'roadmap'

export type ModuleKey = Exclude<SectionId, 'dashboard'>
export type HabitCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type HabitType = 'boolean' | 'numeric' | 'timer'
export type SkillBucket = 'goodAt' | 'workingOn' | 'wantToLearn'
export type ReadingCategory =
  | 'Business'
  | 'Startup'
  | 'Finance'
  | 'Geo-politics'
  | 'Self-development'
  | 'History'

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
}

export interface ExperienceItem extends BaseRecord {
  role: string
  company: string
  period: string
  summary: string
}

export interface EducationItem extends BaseRecord {
  institution: string
  degree: string
  period: string
  notes: string
}

export interface ResumeLink extends BaseRecord {
  label: string
  url: string
}

export interface UserProfile {
  fullName: string
  headline: string
  summary: string
  location: string
  email: string
  phone: string
  website: string
  experience: ExperienceItem[]
  education: EducationItem[]
  certifications: string[]
  coreSkills: string[]
  links: ResumeLink[]
}

export interface WorkTask extends BaseRecord {
  title: string
  completed: boolean
  dueDate: string | null
  priority: 'P1' | 'P2' | 'P3' | 'P4'
}

export interface WorkProject extends BaseRecord {
  name: string
  status: 'Active' | 'Paused' | 'Completed'
  description: string
  priority: 'Low' | 'Medium' | 'High'
  addedOn: string
  tasks: WorkTask[]
}

export interface HabitRecord {
  date: string
  value: number
}

export interface Habit extends BaseRecord {
  name: string
  type: HabitType
  targetValue: number
  records: HabitRecord[]
  completedDates: string[]
}

export interface SkillItem extends BaseRecord {
  name: string
}

export interface Investment extends BaseRecord {
  name: string
  type: string
  value: string
  notes: string
}

export interface Expense extends BaseRecord {
  name: string
  amount: string
  category: string
  date: string
}

export interface LearningItem extends BaseRecord {
  name: string
  platform: string
  progress: number
  notes: string
}

export interface LearningWishlistItem extends BaseRecord {
  name: string
  priority: 'Low' | 'Medium' | 'High'
}

export interface ReadingCurrentItem extends BaseRecord {
  name: string
  author: string
  progress: number
}

export interface ReadingWishlistItem extends BaseRecord {
  name: string
}

export interface NoteItem extends BaseRecord {
  title: string
  content: string
  label: string
  createdOn: string
}

export interface ResponsibilityMember extends BaseRecord {
  name: string
  relationship: string
  expectations: string
  howToBeBetter: string
  commitments: string
}

export interface WishItem extends BaseRecord {
  name: string
  done: boolean
  addedOn: string
  doneDate: string | null
  dueDate?: string | null
  priority?: 'Low' | 'Medium' | 'High'
}

export interface RoadmapTask extends BaseRecord {
  title: string
  status: 'Planned' | 'In Progress' | 'Done'
  priority: 'Low' | 'Medium' | 'High'
  description: string
}

export interface LifeOsData {
  profile: UserProfile
  work: { projects: WorkProject[] }
  habits: {
    daily: Habit[]
    weekly: Habit[]
    monthly: Habit[]
    quarterly: Habit[]
    yearly: Habit[]
  }
  skills: {
    goodAt: SkillItem[]
    workingOn: SkillItem[]
    wantToLearn: SkillItem[]
  }
  wealth: {
    investments: Investment[]
    expenses: Expense[]
  }
  learning: {
    current: LearningItem[]
    wishlist: LearningWishlistItem[]
  }
  reading: {
    current: ReadingCurrentItem[]
    wishlist: Record<ReadingCategory, ReadingWishlistItem[]>
  }
  notes: {
    items: NoteItem[]
  }
  family: {
    members: ResponsibilityMember[]
  }
  wishes: {
    items: WishItem[]
  }
  roadmap: {
    tasks: RoadmapTask[]
  }
}

export interface DashboardStat {
  id: SectionId
  label: string
  value: string | number
  sublabel: string
}

export interface AuthSummary {
  configured: boolean
  mode: 'firebase' | 'local'
  userLabel: string
}
