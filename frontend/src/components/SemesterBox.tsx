import { useState } from 'react'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { pickBestOption, pickFirstRecitationOption } from '../lib/scoring'
import type { Course, SemesterId, Faculty } from '../types'
import { cn } from '../lib/utils'
import { X, GripVertical, AlertTriangle, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import MiniExamCalendar from './MiniExamCalendar'
import Tooltip from './Tooltip'
import { TEST_IDS } from '../testIds'
import styles from './SemesterBox.module.css'

const FACULTY_PILL: Record<Faculty, string> = {
  cs:      styles.pillCs,
  math:    styles.pillMath,
  physics: styles.pillPhysics,
  misc:    styles.pillMisc,
}

function prereqsMet(courseId: string, semId: SemesterId, allPlaced: ReturnType<typeof useDegree>['state']['placed'], exemptions: string[], courseMap: Map<string, Course>) {
  const course = courseMap.get(courseId)
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
  const { courseMap } = useCoursesStore()
  const [dragOver, setDragOver] = useState(false)
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)

  function handleAddPrereq(prereqId: string) {
    const prereqCourse = courseMap.get(prereqId)
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
        lectureOptionId: pickBestOption(prereqCourse, state.placed.filter(p => p.semesterId === targetSem), targetSem, courseMap),
        recitationOptionId: pickFirstRecitationOption(prereqCourse),
        locked: false,
      },
    })
  }

  const placed = state.placed.filter(p => p.semesterId === semesterId)
  const totalCredits = placed.reduce((sum, p) => sum + (courseMap.get(p.courseId)?.credits ?? 0), 0)

  const examMap = new Map<string, string[]>()
  if (showCalendar) {
    placed.forEach(p => {
      const course = courseMap.get(p.courseId)
      if (!course) return
      const existing = examMap.get(course.examDate) ?? []
      examMap.set(course.examDate, [...existing, course.name])
    })
  }

  // --- Semester health ---
  const slots: { day: string; start: number; end: number; cid: string }[] = []
  for (const p of placed) {
    const course = courseMap.get(p.courseId)
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

  const prereqViolations = placed.filter(p => !prereqsMet(p.courseId, semesterId, state.placed, state.exemptions, courseMap)).length

  let closeExamPairs = 0
  if (showCalendar && placed.length > 1) {
    const minGap = state.filters.minExamSeparationDays
    const examDates = placed.map(p => courseMap.get(p.courseId)?.examDate).filter(Boolean) as string[]
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
        const course = courseMap.get(p.courseId)
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
              data-testid={`${TEST_IDS.SEMESTER_BOX.COURSE_CHIP}-${p.courseId}`}
              onDragStart={e => {
                e.dataTransfer.setData('courseId', p.courseId)
                e.dataTransfer.setData('fromSem', String(semesterId))
                e.dataTransfer.setData('source', 'semester')
              }}
              className={cn(styles.chip, isExpanded && styles.chipExpanded)}
            >
              <GripVertical size={10} className={styles.grip} />
              <span className={cn(styles.pill, FACULTY_PILL[course.faculty])}>
                {course.code}
              </span>
              <span
                className={styles.chipName}
                onClick={e => { e.stopPropagation(); setExpandedCourseId(isExpanded ? null : p.courseId) }}
              >
                {course.name}
              </span>
              <ChevronDown
                size={10}
                data-testid={`${TEST_IDS.SEMESTER_BOX.EXPAND_BUTTON}-${p.courseId}`}
                className={cn(styles.chevron, isExpanded && styles.chevronExpanded)}
                onClick={e => { e.stopPropagation(); setExpandedCourseId(isExpanded ? null : p.courseId) }}
              />
              <button
                data-testid={`${TEST_IDS.SEMESTER_BOX.REMOVE_BUTTON}-${p.courseId}`}
                onClick={() => dispatch({ type: 'REMOVE_COURSE', courseId: p.courseId, semesterId })}
                className={styles.removeBtn}
              >
                <X size={10} />
              </button>
            </div>

            {/* Expansion panel */}
            {isExpanded && (
              <div className={styles.expansion}>
                <p className={styles.creditsLine}>
                  <span className={styles.creditsValue}>{course.credits}</span> credit{course.credits !== 1 ? 's' : ''}
                </p>
                {course.prerequisites.length > 0 ? (
                  <div>
                    <p className={styles.prereqLabel}>Prerequisites</p>
                    <div className={styles.prereqList}>
                      {course.prerequisites.map(reqId => {
                        const reqCourse = courseMap.get(reqId)
                        const isMet = satisfied.has(reqId)
                        return (
                          <div
                            key={reqId}
                            className={cn(styles.prereqItem, isMet ? styles.prereqMet : styles.prereqUnmet)}
                            onClick={isMet ? undefined : () => handleAddPrereq(reqId)}
                          >
                            <span className={styles.prereqName}>{reqCourse?.name ?? reqId}</span>
                            {!isMet && <span className={styles.prereqAdd}>+ add</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className={styles.noPrereq}>No prerequisites</p>
                )}
              </div>
            )}
          </div>
        )
      })}
      {placed.length === 0 && (
        <p className={styles.emptyDrop}>Drop courses here</p>
      )}
    </>
  )

  return (
    <div
      data-testid={`${TEST_IDS.SEMESTER_BOX.CONTAINER}-${semesterId}`}
      className={cn(styles.box, dragOver && styles.boxDragOver)}
      onDragOver={e => { e.preventDefault(); setDragOver(true); onDragOver(e, semesterId) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { setDragOver(false); onDrop(e, semesterId) }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {placed.length > 0 && (
            <Tooltip text={semIssues.length > 0 ? semIssues.join(' · ') : 'No issues'} side="top">
              {semStatus === 'critical'
                ? <AlertCircle size={11} className={cn(styles.statusIcon, styles.statusCritical)} />
                : semStatus === 'warning'
                  ? <AlertTriangle size={11} className={cn(styles.statusIcon, styles.statusWarning)} />
                  : <CheckCircle2 size={11} className={cn(styles.statusIcon, styles.statusOk)} />
              }
            </Tooltip>
          )}
          <span className={styles.title}>
            Semester {semesterId}
          </span>
        </div>
        <span className={styles.credits}>{totalCredits} cr</span>
      </div>

      {showCalendar ? (
        /* Side-by-side: course list left, exam calendar right */
        <div className={styles.bodySplit}>
          <div className={styles.bodyList} style={{ width: '42%', flexShrink: 0 }}>
            {courseList}
          </div>
          <div className={styles.calendarPane}>
            {examMap.size > 0
              ? <MiniExamCalendar examMap={examMap} />
              : <p className={styles.calendarEmpty}>Exam calendar appears once courses are added</p>
            }
          </div>
        </div>
      ) : (
        /* Course list takes full area */
        <div className={styles.bodyFull}>
          {courseList}
        </div>
      )}
    </div>
  )
}
