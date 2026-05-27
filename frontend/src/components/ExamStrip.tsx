import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import type { SemesterId, Faculty } from '../types'
import { cn } from '../lib/utils'
import styles from './ExamStrip.module.css'

const FACULTY_COLORS: Record<Faculty, string> = {
  cs:       styles.examCs,
  math:     styles.examMath,
  physics:  styles.examPhysics,
  misc:     styles.examMisc,
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props { semesterId: SemesterId }

export default function ExamStrip({ semesterId }: Props) {
  const { state } = useDegree()
  const { courseMap } = useCoursesStore()
  const placed = state.placed.filter(p => p.semesterId === semesterId)

  const exams = placed
    .map(p => courseMap.get(p.courseId))
    .filter(Boolean)
    .sort((a, b) => a!.examDate.localeCompare(b!.examDate))

  if (exams.length === 0) {
    return (
      <div className={styles.strip}>
        <p className={styles.title}>Exam Period</p>
        <p className={styles.emptyText}>No exams scheduled</p>
      </div>
    )
  }

  return (
    <div className={styles.strip}>
      <p className={styles.title}>Exam Period</p>
      <div className={styles.list}>
        {exams.map(course => {
          if (!course) return null
          return (
            <div
              key={course.id}
              className={cn(
                styles.exam,
                FACULTY_COLORS[course.faculty]
              )}
            >
              <span className={styles.date}>{formatDate(course.examDate)}</span>
              <span className={styles.name}>{course.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
