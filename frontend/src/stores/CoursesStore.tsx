import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useAPIFetch } from '../hooks/useAPIFetch'
import type { Course, PlacedCourse } from '../types'

type TrackId = 'cs' | 'math' | 'physics'

interface CoursesResponse { courses: Course[] }
interface InitialPlacedResponse { placed: PlacedCourse[] }
interface PlanResponse { track: TrackId; entries: Omit<PlacedCourse, 'locked'>[] }

interface CoursesContextValue {
  courses: Course[]
  courseMap: Map<string, Course>
  initialPlaced: PlacedCourse[]
  isLoading: boolean
  fetchPlan: (track: TrackId) => Promise<Omit<PlacedCourse, 'locked'>[]>
  refresh: () => void
}

const CoursesContext = createContext<CoursesContextValue | null>(null)

export function CoursesProvider({ children }: { children: ReactNode }) {
  const [coursesResp, coursesLoading, refreshCourses] = useAPIFetch<CoursesResponse>(
    '/api/scheduler/courses',
    { courses: [] },
  )
  const [placedResp, placedLoading, refreshPlaced] = useAPIFetch<InitialPlacedResponse>(
    '/api/scheduler/initial-placed',
    { placed: [] },
  )

  const courses = coursesResp.courses
  const initialPlaced = placedResp.placed
  const courseMap = useMemo(
    () => new Map(courses.map(c => [c.id, c])),
    [courses],
  )

  const isLoading = coursesLoading || placedLoading

  const fetchPlan = async (track: TrackId) => {
    const res = await fetch(`/api/scheduler/plans/${track}`, { credentials: 'include' })
    if (!res.ok) throw new Error(`Failed to load plan '${track}'`)
    const json = (await res.json()) as PlanResponse
    return json.entries
  }

  const value: CoursesContextValue = {
    courses,
    courseMap,
    initialPlaced,
    isLoading,
    fetchPlan,
    refresh: () => { refreshCourses(); refreshPlaced() },
  }

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>
}

export function useCoursesStore(): CoursesContextValue {
  const ctx = useContext(CoursesContext)
  if (!ctx) throw new Error('useCoursesStore must be used within CoursesProvider')
  return ctx
}
