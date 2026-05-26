import { useState } from 'react'
import { useDegree } from '../state/DegreeContext'
import { COURSE_MAP } from '../data/courses'
import { pickBestOption, pickFirstRecitationOption } from '../lib/scoring'
import type { SemesterId, Faculty } from '../types'
import { cn } from '../lib/utils'
import { X, GripVertical, AlertTriangle, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import MiniExamCalendar from './MiniExamCalendar'
import Tooltip from './Tooltip'

const FACULTY_PILL: Record<Faculty, string> = {
  cs:      'bg-blue-100 text-blue-700',
  math:    'bg-violet-100 text-violet-700',
  physics: 'bg-amber-100 text-amber-700',
  misc:    'bg-stone-100 text-stone-600',
}

function prereqsMet(courseId: string, semId: SemesterId, allPlaced: ReturnType<typeof useDegree>['state']['placed'], exemptions: string[]) {
  const course = COURSE_MAP.get(courseId)
  if (!course || course.prerequisites.length === 0) return true
  const satisfied = new Set([
    ...allPlaced.filter(p => p.semesterId < semId).map(p => p.courseId),
    ...exemptions,
  ])
  return course.prerequisites.every(id => satisfied.has(id))
}

interface Props {
  semesterId: SemesterId
  showCalendar?: boolean
  onDragOver: (e: React.DragEvent, semId: SemesterId) => void
  onDrop: (e: React.DragEvent, semId: SemesterId) => void
}

export default function SemesterBox({ semesterId, showCalendar, onDragOver, onDrop }: Props) {
  const { state, dispatch } = useDegree()
  const [dragOver, setDragOver] = useState(false)
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)

  function handleAddPrereq(prereqId: string) {
    const prereqCourse = COURSE_MAP.get(prereqId)
    if (!prereqCourse) return
    const targetSem = ([1, 2, 3, 4, 5, 6] as SemesterId[]).find(sem => {
      const sat = new Set([
        ...state.placed.filter(p => p.semesterId < sem).map(p => p.courseId),
        ...state.exemptions,
      ])
      return prereqCourse.prerequisites.every(id => sat.has(id))
    }) ?? 1
    dispatch({
      type: 'ADD_COURSE',
      payload: {
        courseId: prereqId,
        semesterId: targetSem,
        lectureOptionId: pickBestOption(prereqCourse, state.placed.filter(p => p.semesterId === targetSem), targetSem),
        recitationOptionId: pickFirstRecitationOption(prereqCourse),
        locked: false,
      },
    })
  }

  const placed = state.placed.filter(p => p.semesterId === semesterId)
  const totalCredits = placed.reduce((sum, p) => sum + (COURSE_MAP.get(p.courseId)?.credits ?? 0), 0)

  const examMap = new Map<string, string[]>()
  if (showCalendar) {
    placed.forEach(p => {
      const course = COURSE_MAP.get(p.courseId)
      if (!course) return
      const existing = examMap.get(course.examDate) ?? []
      examMap.set(course.examDate, [...existing, course.name])
    })
  }

  // --- Semester health ---
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
  let collisions = 0
  for (let i = 0; i < slots.length; i++)
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i].cid === slots[j].cid || slots[i].day !== slots[j].day) continue
      if (Math.max(slots[i].start, slots[j].start) < Math.min(slots[i].end, slots[j].end)) collisions++
    }

  const prereqViolations = placed.filter(p => !prereqsMet(p.courseId, semesterId, state.placed, state.exemptions)).length

  let closeExamPairs = 0
  if (showCalendar && placed.length > 1) {
    const minGap = state.filters.minExamSeparationDays
    const examDates = placed.map(p => COURSE_MAP.get(p.courseId)?.examDate).filter(Boolean) as string[]
    for (let i = 0; i < examDates.length; i++)
      for (let j = i + 1; j < examDates.length; j++) {
        const gap = Math.abs(new Date(examDates[i]).getTime() - new Date(examDates[j]).getTime()) / 86400000
        if (gap < minGap) closeExamPairs++
      }
  }

  const semIssues: string[] = []
  if (collisions > 0) semIssues.push(`${collisions} time collision${collisions > 1 ? 's' : ''}`)
  if (prereqViolations > 0) semIssues.push(`${prereqViolations} course${prereqViolations > 1 ? 's' : ''} missing prerequisites`)
  if (closeExamPairs > 0) semIssues.push(`${closeExamPairs} exam pair${closeExamPairs > 1 ? 's' : ''} too close`)
  const semStatus = (collisions > 0 || prereqViolations > 0) ? 'critical' : closeExamPairs > 0 ? 'warning' : 'ok'

  const courseList = (
    <>
      {placed.map(p => {
        const course = COURSE_MAP.get(p.courseId)
        if (!course) return null
        const isExpanded = expandedCourseId === p.courseId
        const satisfied = new Set([
          ...state.placed.filter(pl => pl.semesterId < semesterId).map(pl => pl.courseId),
          ...state.exemptions,
        ])

        return (
          <div key={p.courseId}>
            {/* Chip row */}
            <div
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('courseId', p.courseId)
                e.dataTransfer.setData('fromSem', String(semesterId))
                e.dataTransfer.setData('source', 'semester')
              }}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 bg-stone-50 hover:bg-stone-100 transition-colors group cursor-grab active:cursor-grabbing',
                isExpanded ? 'rounded-t-lg' : 'rounded-lg'
              )}
            >
              <GripVertical size={10} className="text-stone-300 shrink-0" />
              <span className={cn('text-[9px] font-bold px-1 py-0.5 rounded shrink-0', FACULTY_PILL[course.faculty])}>
                {course.code}
              </span>
              <span
                className="flex-1 text-[11px] text-stone-700 truncate cursor-pointer select-none"
                onClick={e => { e.stopPropagation(); setExpandedCourseId(isExpanded ? null : p.courseId) }}
              >
                {course.name}
              </span>
              <ChevronDown
                size={10}
                className={cn('shrink-0 text-stone-300 cursor-pointer transition-transform hover:text-stone-500', isExpanded && 'rotate-180')}
                onClick={e => { e.stopPropagation(); setExpandedCourseId(isExpanded ? null : p.courseId) }}
              />
              <button
                onClick={() => dispatch({ type: 'REMOVE_COURSE', courseId: p.courseId, semesterId })}
                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all shrink-0"
              >
                <X size={10} />
              </button>
            </div>

            {/* Expansion panel */}
            {isExpanded && (
              <div className="rounded-b-lg border border-t-0 border-stone-200 bg-white px-2.5 py-2 space-y-2">
                <p className="text-[10px] text-stone-500">
                  <span className="font-semibold text-stone-700">{course.credits}</span> credit{course.credits !== 1 ? 's' : ''}
                </p>
                {course.prerequisites.length > 0 ? (
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wide text-stone-400 mb-1">Prerequisites</p>
                    <div className="space-y-0.5">
                      {course.prerequisites.map(reqId => {
                        const reqCourse = COURSE_MAP.get(reqId)
                        const isMet = satisfied.has(reqId)
                        return (
                          <div
                            key={reqId}
                            className={cn(
                              'flex items-center justify-between text-[9px] px-1.5 py-1 rounded-md transition-colors',
                              isMet
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer'
                            )}
                            onClick={isMet ? undefined : () => handleAddPrereq(reqId)}
                          >
                            <span className="truncate">{reqCourse?.name ?? reqId}</span>
                            {!isMet && <span className="text-[8px] ml-1.5 opacity-50 shrink-0">+ add</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-stone-400">No prerequisites</p>
                )}
              </div>
            )}
          </div>
        )
      })}
      {placed.length === 0 && (
        <p className="text-[10px] text-stone-300 text-center py-3">Drop courses here</p>
      )}
    </>
  )

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-xl border bg-white transition-colors overflow-hidden',
        dragOver ? 'border-stone-400 ring-2 ring-stone-200' : 'border-stone-200'
      )}
      onDragOver={e => { e.preventDefault(); setDragOver(true); onDragOver(e, semesterId) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, semesterId) }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-1.5">
          {placed.length > 0 && (
            <Tooltip text={semIssues.length > 0 ? semIssues.join(' · ') : 'No issues'} side="top">
              {semStatus === 'critical'
                ? <AlertCircle size={11} className="text-red-500 cursor-default shrink-0" />
                : semStatus === 'warning'
                  ? <AlertTriangle size={11} className="text-amber-500 cursor-default shrink-0" />
                  : <CheckCircle2 size={11} className="text-emerald-500 cursor-default shrink-0" />
              }
            </Tooltip>
          )}
          <span className="text-[12px] font-bold uppercase tracking-wide text-stone-600">
            Semester {semesterId}
          </span>
        </div>
        <span className="text-[11px] text-stone-400 tabular-nums">{totalCredits} cr</span>
      </div>

      {showCalendar ? (
        /* Side-by-side: course list left, exam calendar right */
        <div className="flex flex-1 min-h-0">
          <div className="overflow-y-auto p-2 space-y-1 border-r border-stone-100" style={{ width: '42%', flexShrink: 0 }}>
            {courseList}
          </div>
          <div className="flex-1 min-w-0 overflow-y-auto">
            {examMap.size > 0
              ? <MiniExamCalendar examMap={examMap} />
              : <p className="text-[9px] text-stone-300 text-center pt-4 px-2">Exam calendar appears once courses are added</p>
            }
          </div>
        </div>
      ) : (
        /* Course list takes full area */
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {courseList}
        </div>
      )}
    </div>
  )
}
