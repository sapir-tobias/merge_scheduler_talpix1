import { useState } from 'react'
import { AlertTriangle, AlertOctagon, ChevronDown, ChevronUp, Plus, Check, ArrowRight, GripVertical } from 'lucide-react'
import { cn } from '../lib/utils'
import Tooltip from './Tooltip'
import type { Course, CourseScore, Faculty } from '../types'
import { useCoursesStore } from '../stores/CoursesStore'

const FACULTY_BADGE: Record<Faculty, string> = {
  cs:      'bg-blue-100 text-blue-700',
  math:    'bg-violet-100 text-violet-700',
  physics: 'bg-amber-100 text-amber-700',
  misc:    'bg-stone-100 text-stone-600',
}
const FACULTY_LABEL: Record<Faculty, string> = {
  cs: 'CS', math: 'Math', physics: 'Phys', misc: 'Misc',
}
const DAY_LABEL: Record<string, string> = {
  sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
}

function formatTime(h: number) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

function formatExamDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  course: Course
  scoreInfo: CourseScore
  added: boolean
  addedToCurrentSem: boolean
  onAdd?: () => void
  draggable?: boolean
}

export default function CourseItem({ course, scoreInfo, added, addedToCurrentSem, onAdd, draggable }: Props) {
  const { courseMap } = useCoursesStore()
  const [expanded, setExpanded] = useState(false)
  const prereqNames = course.prerequisites.map(id => courseMap.get(id)?.name ?? id)

  return (
    <div
      className={cn(
        'border-b border-stone-100 last:border-b-0',
        scoreInfo.critical && !addedToCurrentSem && 'bg-red-50/40',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={draggable}
      onDragStart={draggable ? e => {
        e.dataTransfer.setData('courseId', course.id)
        e.dataTransfer.setData('source', 'catalogue')
      } : undefined}
    >
      {/* Slim row */}
      <div className="flex items-center gap-2 px-3 py-2">
        {draggable && (
          <GripVertical size={11} className="text-stone-300 shrink-0 -ml-1" />
        )}

        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0', FACULTY_BADGE[course.faculty])}>
          {FACULTY_LABEL[course.faculty]}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-stone-800 leading-tight truncate">{course.name}</p>
          <p className="text-[10px] text-stone-400 leading-tight">{course.code} · {course.credits} cr</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Critical: scheduling breach" className="shrink-0">
              <AlertOctagon size={13} className="text-red-500" />
            </Tooltip>
          )}
          {scoreInfo.warning && !scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Minor scheduling issue" className="shrink-0">
              <AlertTriangle size={13} className="text-amber-500" />
            </Tooltip>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className="text-stone-400 hover:text-stone-600 transition-colors p-0.5"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {onAdd && (
            <Tooltip
              text={added && !addedToCurrentSem ? 'Move to this semester' : addedToCurrentSem ? 'Already here' : 'Add to schedule'}
              className="shrink-0"
            >
              <button
                onClick={onAdd}
                disabled={addedToCurrentSem}
                className={cn(
                  'flex items-center justify-center w-[22px] h-[22px] rounded-md transition-colors',
                  addedToCurrentSem
                    ? 'bg-stone-100 text-stone-400 cursor-default'
                    : added
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-stone-900 text-white hover:bg-stone-700'
                )}
              >
                {addedToCurrentSem ? <Check size={11} /> : added ? <ArrowRight size={11} /> : <Plus size={11} />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-[11px] text-stone-500 leading-relaxed">{course.description}</p>

          {course.lectureOptions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Lecture times</p>
              {course.lectureOptions.map(opt => (
                <div key={opt.id} className="flex flex-wrap gap-1 mb-1">
                  <span className="text-[9px] font-bold text-stone-400 self-center">{opt.id.toUpperCase()}:</span>
                  {opt.slots.map((slot, si) => (
                    <span key={si} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                      {DAY_LABEL[slot.day]} {formatTime(slot.startHour)}–{formatTime(slot.endHour)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
          {course.lectureOptions.length === 0 && (
            <p className="text-[10px] text-stone-400 italic">Lab / recitation only — no fixed lectures</p>
          )}
          {course.recitationOptions && course.recitationOptions.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Recitation times</p>
              {course.recitationOptions.map(opt => (
                <div key={opt.id} className="flex flex-wrap gap-1 mb-1">
                  <span className="text-[9px] font-bold text-stone-400 self-center">{opt.id.toUpperCase()}:</span>
                  {opt.slots.map((slot, si) => (
                    <span key={si} className="text-[10px] bg-stone-50 border border-stone-200 text-stone-600 px-2 py-0.5 rounded-md">
                      {DAY_LABEL[slot.day]} {formatTime(slot.startHour)}–{formatTime(slot.endHour)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Exam</p>
              <p className="text-[11px] text-stone-700">{formatExamDate(course.examDate)}</p>
            </div>
            {scoreInfo.examSeparationMin >= 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Gap</p>
                <p className={cn('text-[11px]', scoreInfo.critical ? 'text-red-600' : 'text-stone-700')}>
                  {scoreInfo.examSeparationMin}d
                </p>
              </div>
            )}
            {scoreInfo.collisions > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Collisions</p>
                <p className="text-[11px] text-amber-700">{scoreInfo.collisions}</p>
              </div>
            )}
          </div>

          {prereqNames.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-1">Prerequisites</p>
              <div className="flex flex-wrap gap-1">
                {prereqNames.map(name => (
                  <span key={name} className={cn(
                    'text-[10px] px-2 py-0.5 rounded-md',
                    scoreInfo.prerequisitesMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
