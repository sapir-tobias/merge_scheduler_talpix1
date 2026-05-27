import { createContext, useContext, useMemo } from 'react'
import { useAPIFetch } from '../hooks/useAPIFetch'

const CoursesContext = createContext(null)

export function CoursesProvider({ children }) {
  const [coursesResp, coursesLoading, refreshCourses] = useAPIFetch(
    '/api/scheduler/courses',
    { courses: [] },
  )
  const [placedResp, placedLoading, refreshPlaced] = useAPIFetch(
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

  const fetchPlan = async (track) => {
    const res = await fetch(`/api/scheduler/plans/${track}`, { credentials: 'include' })
    if (!res.ok) throw new Error(`Failed to load plan '${track}'`)
    const json = await res.json()
    return json.entries
  }

  const value = {
    courses,
    courseMap,
    initialPlaced,
    isLoading,
    fetchPlan,
    refresh: () => { refreshCourses(); refreshPlaced() },
  }

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>
}

export function useCoursesStore() {
  const ctx = useContext(CoursesContext)
  if (!ctx) throw new Error('useCoursesStore must be used within CoursesProvider')
  return ctx
}
