import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDegree } from '../state/DegreeContext'
import { COURSE_MAP } from '../data/courses'
import type { SemesterId, Faculty } from '../types'
import { X, LayoutGrid, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { scoreCourse } from '../lib/scoring'
import Tooltip from './Tooltip'
import SchedulePreviewPanel from './SchedulePreviewPanel'

const FACULTY_DOT: Record<Faculty, string> = {
  cs:      'bg-blue-400',
  math:    'bg-violet-400',
  physics: 'bg-amber-400',
  misc:    'bg-stone-400',
}
const FACULTY_OPT_ACTIVE: Record<Faculty, string> = {
  cs:      'bg-blue-200 text-blue-800 border-blue-300',
  math:    'bg-violet-200 text-violet-800 border-violet-300',
  physics: 'bg-amber-200 text-amber-800 border-amber-300',
  misc:    'bg-stone-200 text-stone-700 border-stone-300',
}

function formatSlots(slots: { day: string; startHour: number; endHour: number }[]) {
  return slots.map(s => `${s.day[0].toUpperCase()}${s.day.slice(1, 3)} ${s.startHour}–${s.endHour}`).join('  ·  ')
}
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ExpandedPanel { courseId: string; rect: DOMRect }

interface Props { semesterId: SemesterId }

export default function SemesterCourseList({ semesterId }: Props) {
  const { state, dispatch } = useDegree()
  const [showPreview, setShowPreview] = useState(false)
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel | null>(null)
  const placed = state.placed.filter(p => p.semesterId === semesterId)

  // Dismiss expanded panel on outside click
  useEffect(() => {
    if (!expandedPanel) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-course-panel]')) setExpandedPanel(null)
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [expandedPanel])

  if (placed.length === 0) {
    return (
      <div className="shrink-0 h-10 border-t border-stone-200 flex items-center px-4 bg-stone-50/40">
        <p className="text-[11px] text-stone-300">No courses scheduled — add from the catalogue</p>
      </div>
    )
  }

  const totalCombos = placed.reduce((acc, p) => {
    const course = COURSE_MAP.get(p.courseId)
    if (!course) return acc
    const lCount = Math.max(1, course.lectureOptions.length)
    const rCount = Math.max(1, course.recitationOptions?.length ?? 0)
    return acc * lCount * rCount
  }, 1)

  const hasCollisions = (() => {
    const slots: { day: string; start: number; end: number; cid: string }[] = []
    for (const p of placed) {
      const course = COURSE_MAP.get(p.courseId)
      if (!course) continue
      const lOpt = course.lectureOptions.find(o => o.id === p.lectureOptionId)
      if (lOpt) for (const s of lOpt.slots) slots.push({ day: s.day, start: s.startHour, end: s.endHour, cid: p.courseId })
      if (p.recitationOptionId) {
        const rOpt = course.recitationOptions?.find(o => o.id === p.recitationOptionId)
        if (rOpt) for (const s of rOpt.slots) slots.push({ day: s.day, start: s.startHour, end: s.endHour, cid: p.courseId })
      }
    }
    for (let i = 0; i < slots.length; i++)
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].cid === slots[j].cid || slots[i].day !== slots[j].day) continue
        if (Math.max(slots[i].start, slots[j].start) < Math.min(slots[i].end, slots[j].end)) return true
      }
    for (const s of slots)
      for (const b of state.blockers.filter(b => b.semesterId === semesterId))
        if (s.day === b.day && Math.max(s.start, b.startHour) < Math.min(s.end, b.endHour)) return true
    return false
  })()

  const panelCourse = expandedPanel ? COURSE_MAP.get(expandedPanel.courseId) : null
  const panelPlaced = expandedPanel ? placed.find(p => p.courseId === expandedPanel.courseId) : null

  return (
    <>
      <div className="shrink-0 border-t border-stone-200 bg-white flex items-stretch overflow-hidden">
        {/* Scrollable course chips — fixed height, no expansion inside */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max divide-x divide-stone-100">
            {placed.map(p => {
              const course = COURSE_MAP.get(p.courseId)
              if (!course) return null
              const isExpanded = expandedPanel?.courseId === p.courseId
              const canExpand = course.lectureOptions.length > 1 || (course.recitationOptions?.length ?? 0) > 0
              const score = scoreCourse(course, state.placed, state.exemptions, semesterId, state.filters)
              const scoreTooltip = (() => {
                if (!score.critical && !score.warning) return 'No scheduling issues'
                const parts: string[] = []
                if (score.collisions > 0) parts.push(`${score.collisions} time collision${score.collisions > 1 ? 's' : ''}`)
                if (score.examSeparationMin >= 0 && score.examSeparationMin < state.filters.minExamSeparationDays + 3)
                  parts.push(`Exam gap: ${score.examSeparationMin}d (min ${state.filters.minExamSeparationDays}d)`)
                if (!score.prerequisitesMet && !state.filters.ignorePrerequisites) parts.push('Prerequisites not met')
                return parts.join(' · ') || 'Issues detected'
              })()

              return (
                <div key={p.courseId} className="flex items-center gap-2.5 px-3 py-2 group min-w-0">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', FACULTY_DOT[course.faculty])} />
                  <Tooltip text={scoreTooltip} side="top">
                    {score.critical
                      ? <AlertCircle size={10} className="text-red-500 shrink-0 cursor-default" />
                      : score.warning
                        ? <AlertTriangle size={10} className="text-amber-500 shrink-0 cursor-default" />
                        : <CheckCircle2 size={10} className="text-emerald-500 shrink-0 cursor-default" />
                    }
                  </Tooltip>

                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-stone-800 whitespace-nowrap">{course.name}</p>
                    <p className="text-[9px] text-stone-400">{course.code}</p>
                  </div>

                  <span className="text-[10px] text-stone-400 whitespace-nowrap shrink-0">
                    {formatDate(course.examDate)}
                  </span>

                  {canExpand && (
                    <button
                      data-course-panel
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setExpandedPanel(isExpanded ? null : { courseId: p.courseId, rect })
                      }}
                      className={cn(
                        'shrink-0 p-0.5 rounded transition-colors',
                        isExpanded ? 'text-stone-700 bg-stone-100' : 'text-stone-400 hover:text-stone-600'
                      )}
                    >
                      <ChevronDown size={11} className={cn('transition-transform', isExpanded ? 'rotate-0' : 'rotate-180')} />
                    </button>
                  )}

                  <button
                    onClick={() => dispatch({ type: 'REMOVE_COURSE', courseId: p.courseId, semesterId })}
                    className="text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Combinations button */}
        {totalCombos > 1 && (
          <Tooltip text={`${totalCombos} lecture schedule combinations`} side="top" className="shrink-0 flex">
            <button
              onClick={() => setShowPreview(true)}
              className={cn(
                'border-l border-stone-200 px-3 flex items-center gap-1.5 transition-colors',
                showPreview
                  ? 'bg-stone-900 text-white'
                  : hasCollisions
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              )}
            >
              <LayoutGrid size={12} />
              <span className="text-[11px] font-medium whitespace-nowrap">
                Combinations <span className="text-[10px] opacity-60">({totalCombos})</span>
              </span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Options panel — portal floating ABOVE the bar */}
      {expandedPanel && panelCourse && panelPlaced && createPortal(
        <div
          data-course-panel
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-stone-200 p-3"
          style={{
            bottom: window.innerHeight - expandedPanel.rect.top + 8,
            left: Math.min(expandedPanel.rect.left, window.innerWidth - 260),
            minWidth: 240,
            maxHeight: Math.min(420, expandedPanel.rect.top - 12),
            overflowY: 'auto',
          }}
        >
          <p className="text-[10px] font-bold text-stone-700 mb-2.5 px-0.5">{panelCourse.name}</p>

          {panelCourse.lectureOptions.length > 0 && (
            <div className="mb-2.5">
              <p className="text-[8px] font-bold uppercase tracking-wide text-stone-400 mb-1.5 px-0.5">Lecture</p>
              <div className="flex gap-1 flex-wrap">
                {panelCourse.lectureOptions.map(opt => (
                  <Tooltip key={opt.id} text={formatSlots(opt.slots)} side="top">
                    <button
                      onClick={() => dispatch({ type: 'SET_LECTURE_OPTION', courseId: expandedPanel.courseId, semesterId, optionId: opt.id })}
                      className={cn(
                        'flex flex-col items-start text-left px-2 py-1.5 rounded-lg border transition-colors',
                        panelPlaced.lectureOptionId === opt.id
                          ? FACULTY_OPT_ACTIVE[panelCourse.faculty]
                          : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <span className="text-[10px] font-bold leading-none mb-1">{opt.id.toUpperCase()}</span>
                      {opt.slots.map((s, i) => (
                        <span key={i} className="text-[8px] leading-tight whitespace-nowrap opacity-80">
                          {s.day[0].toUpperCase()}{s.day.slice(1, 3)} {s.startHour}–{s.endHour}
                        </span>
                      ))}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {panelCourse.recitationOptions && panelCourse.recitationOptions.length > 0 && (
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wide text-stone-400 mb-1.5 px-0.5">Recitation</p>
              <div className="flex gap-1 flex-wrap">
                {panelCourse.recitationOptions.map(opt => (
                  <Tooltip key={opt.id} text={formatSlots(opt.slots)} side="top">
                    <button
                      onClick={() => dispatch({ type: 'SET_RECITATION_OPTION', courseId: expandedPanel.courseId, semesterId, optionId: opt.id })}
                      className={cn(
                        'flex flex-col items-start text-left px-2 py-1.5 rounded-lg border transition-colors',
                        panelPlaced.recitationOptionId === opt.id
                          ? FACULTY_OPT_ACTIVE[panelCourse.faculty]
                          : 'border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50'
                      )}
                    >
                      <span className="text-[10px] font-bold leading-none mb-1">{opt.id.toUpperCase()}</span>
                      {opt.slots.map((s, i) => (
                        <span key={i} className="text-[8px] leading-tight whitespace-nowrap opacity-80">
                          {s.day[0].toUpperCase()}{s.day.slice(1, 3)} {s.startHour}–{s.endHour}
                        </span>
                      ))}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {showPreview && (
        <SchedulePreviewPanel
          semesterId={semesterId}
          placed={placed}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
