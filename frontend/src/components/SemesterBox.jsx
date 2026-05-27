import { useState } from 'react'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { pickBestOption, pickFirstRecitationOption } from '../lib/scoring'
import { cn } from '../lib/utils'
import MiniExamCalendar from './MiniExamCalendar'
import SemesterBoxBody, { SemesterHealthBadge } from './scheduler/SemesterBoxBody'
import { TEST_IDS } from '../testIds'
import styles from './SemesterBox.module.css'

const FACULTY_PILL = {
  cs:      styles.pillCs,
  math:    styles.pillMath,
  physics: styles.pillPhysics,
  misc:    styles.pillMisc,
}

function prereqsMet(courseId, semId, allPlaced, exemptions, courseMap) {
  const course = courseMap.get(courseId)
  if (!course || course.prerequisites.length === 0) return true
  const satisfied = new Set([
    ...allPlaced.filter(p => p.semesterId < semId).map(p => p.courseId),
    ...exemptions,
  ])
  return course.prerequisites.every(id => satisfied.has(id))
}

export default function SemesterBox({ semesterId, showCalendar, onDragOver, onDrop }) {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
  const [dragOver, setDragOver] = useState(false)
  const [expandedCourseId, setExpandedCourseId] = useState(null)

  function handleAddPrereq(prereqId) {
    const prereqCourse = courseMap.get(prereqId)
    if (!prereqCourse) return
    const targetSem = ([1, 2, 3, 4, 5, 6]).find(sem => {
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

  const examMap = new Map()
  if (showCalendar) {
    placed.forEach(p => {
      const course = courseMap.get(p.courseId)
      if (!course || !course.examDate) return  // skip courses with no final
      const existing = examMap.get(course.examDate) ?? []
      examMap.set(course.examDate, [...existing, course.name])
    })
  }

  // --- Semester health ---
  const slots = []
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
    const examDates = placed.map(p => courseMap.get(p.courseId)?.examDate).filter(Boolean)
    for (let i = 0; i < examDates.length; i++)
      for (let j = i + 1; j < examDates.length; j++) {
        const gap = Math.abs(new Date(examDates[i]).getTime() - new Date(examDates[j]).getTime()) / 86400000
        if (gap < minGap) closeExamPairs++
      }
  }

  const semIssues = []
  if (collisions > 0) semIssues.push(`${collisions} time collision${collisions > 1 ? 's' : ''}`)
  if (prereqViolations > 0) semIssues.push(`${prereqViolations} course${prereqViolations > 1 ? 's' : ''} missing prerequisites`)
  if (closeExamPairs > 0) semIssues.push(`${closeExamPairs} exam pair${closeExamPairs > 1 ? 's' : ''} too close`)
  const semStatus = (collisions > 0 || prereqViolations > 0) ? 'critical' : closeExamPairs > 0 ? 'warning' : 'ok'

  const courseList = (
    <SemesterBoxBody
      placed={placed}
      courseMap={courseMap}
      semesterId={semesterId}
      allPlaced={state.placed}
      exemptions={state.exemptions}
      expandedCourseId={expandedCourseId}
      setExpandedCourseId={setExpandedCourseId}
      onAddPrereq={handleAddPrereq}
      dispatch={dispatch}
      styles={styles}
      facultyPill={FACULTY_PILL}
      TEST_IDS={TEST_IDS}
    />
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
            <SemesterHealthBadge semStatus={semStatus} semIssues={semIssues} styles={styles} />
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
