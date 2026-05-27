import { useState, useEffect } from 'react'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { LayoutGrid } from 'lucide-react'
import { cn } from '../lib/utils'
import { scoreCourse } from '../lib/scoring'
import Tooltip from './Tooltip'
import SchedulePreviewPanel from './SchedulePreviewPanel'
import SemesterCourseChip, { SemesterCourseOptionsPanel } from './scheduler/SemesterCourseChip'
import { TEST_IDS } from '../testIds'
import styles from './SemesterCourseList.module.css'

export default function SemesterCourseList({ semesterId }) {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
  const [showPreview, setShowPreview] = useState(false)
  const [expandedPanel, setExpandedPanel] = useState(null)
  const placed = state.placed.filter(p => p.semesterId === semesterId)

  // Dismiss expanded panel on outside click
  useEffect(() => {
    if (!expandedPanel) return
    const handler = (e) => {
      if (!e.target.closest('[data-course-panel]')) setExpandedPanel(null)
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [expandedPanel])

  if (placed.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No courses scheduled — add from the catalogue</p>
      </div>
    )
  }

  const totalCombos = placed.reduce((acc, p) => {
    const course = courseMap.get(p.courseId)
    if (!course) return acc
    const lCount = Math.max(1, course.lectureOptions.length)
    const rCount = Math.max(1, course.recitationOptions?.length ?? 0)
    return acc * lCount * rCount
  }, 1)

  const hasCollisions = (() => {
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

  const panelCourse = expandedPanel ? courseMap.get(expandedPanel.courseId) : null
  const panelPlaced = expandedPanel ? placed.find(p => p.courseId === expandedPanel.courseId) : null

  return (
    <>
      <div className={styles.bar} data-testid={TEST_IDS.SEMESTER_COURSE_LIST.BAR}>
        {/* Scrollable course chips — fixed height, no expansion inside */}
        <div className={styles.chipScroll}>
          <div className={styles.chipRow}>
            {placed.map(p => {
              const course = courseMap.get(p.courseId)
              if (!course) return null
              const score = scoreCourse(course, state.placed, state.exemptions, semesterId, state.filters, courseMap)
              return (
                <SemesterCourseChip
                  key={p.courseId}
                  placed={p}
                  course={course}
                  score={score}
                  semesterId={semesterId}
                  isExpanded={expandedPanel?.courseId === p.courseId}
                  onToggleExpand={setExpandedPanel}
                  dispatch={dispatch}
                  filters={state.filters}
                  TEST_IDS={TEST_IDS}
                />
              )
            })}
          </div>
        </div>

        {/* Combinations button */}
        {totalCombos > 1 && (
          <Tooltip text={`${totalCombos} lecture schedule combinations`} side="top" className={styles.combosTooltip}>
            <button
              data-testid={TEST_IDS.SEMESTER_COURSE_LIST.COMBINATIONS_BUTTON}
              onClick={() => setShowPreview(true)}
              className={cn(
                styles.combosBtn,
                showPreview
                  ? styles.combosBtnActive
                  : hasCollisions
                    ? styles.combosBtnCollisions
                    : undefined
              )}
            >
              <LayoutGrid size={12} />
              <span className={styles.combosLabel}>
                Combinations <span className={styles.combosCount}>({totalCombos})</span>
              </span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Options panel — portal floating ABOVE the bar */}
      <SemesterCourseOptionsPanel
        expandedPanel={expandedPanel}
        panelCourse={panelCourse}
        panelPlaced={panelPlaced}
        semesterId={semesterId}
        dispatch={dispatch}
      />

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
