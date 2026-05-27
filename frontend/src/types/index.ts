export type Faculty = 'cs' | 'math' | 'physics' | 'misc'
export type SemesterId = 1 | 2 | 3 | 4 | 5 | 6
export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu'
export type PlanYear = 1 | 2 | 3
export type TrackId = 'cs' | 'math' | 'physics'

export interface LectureSlot {
  day: DayKey
  startHour: number
  endHour: number
}

export interface LectureOption {
  id: string
  slots: LectureSlot[]
}

export type CourseTerm = 'a' | 'b' | 'either' | 'yearly' | 'summer' | ''

export interface Course {
  id: string
  code: string
  name: string
  nameEn?: string
  faculty: Faculty
  credits: number
  term?: CourseTerm
  lectureOptions: LectureOption[]
  recitationOptions?: LectureOption[]
  examDate: string
  hasExam?: boolean
  mandatoryAttendance?: boolean
  prerequisites: string[]
  description: string
}

export interface PlacedCourse {
  courseId: string
  semesterId: SemesterId
  lectureOptionId: string
  recitationOptionId?: string
  locked: boolean
}

export interface Blocker {
  id: string
  label?: string
  day: DayKey
  startHour: number
  endHour: number
  semesterId: SemesterId
}

export interface CatalogueFilters {
  minCredits: number
  maxCredits: number
  maxCollisions: number
  minExamSeparationDays: number
  ignorePrerequisites: boolean
  faculties: Set<Faculty>
  searchQuery: string
}

export interface CourseScore {
  courseId: string
  score: number
  collisions: number
  examSeparationMin: number
  prerequisitesMet: boolean
  warning: boolean
  critical: boolean
  bestLectureOptionId: string
}

export interface DegreeState {
  placed: PlacedCourse[]
  exemptions: string[]          // courseIds treated as already completed
  filters: CatalogueFilters
  activeSemester: SemesterId
  blockers: Blocker[]
}
