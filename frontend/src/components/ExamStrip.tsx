import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import type { SemesterId, Faculty } from '../types'
import { cn } from '../lib/utils'

const FACULTY_COLORS: Record<Faculty, string> = {
  cs:       'bg-blue-100 text-blue-800 border-blue-200',
  math:     'bg-violet-100 text-violet-800 border-violet-200',
  physics:  'bg-amber-100 text-amber-800 border-amber-200',
  misc:    'bg-stone-100 text-stone-700 border-stone-200',
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
      <div className="shrink-0 border-t border-stone-200 px-4 py-3 bg-stone-50/60">
        <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">Exam Period</p>
        <p className="text-[11px] text-stone-300">No exams scheduled</p>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-stone-200 px-4 py-3 bg-stone-50/60">
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400 mb-2">Exam Period</p>
      <div className="flex flex-wrap gap-2">
        {exams.map(course => {
          if (!course) return null
          return (
            <div
              key={course.id}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px]',
                FACULTY_COLORS[course.faculty]
              )}
            >
              <span className="font-semibold">{formatDate(course.examDate)}</span>
              <span className="opacity-70 truncate max-w-[120px]">{course.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
