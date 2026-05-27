import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { X, LayoutGrid, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { scoreCourse } from '../lib/scoring'
import Tooltip from './Tooltip'
import SchedulePreviewPanel from './SchedulePreviewPanel'
import { TEST_IDS } from '../testIds'
import styles from './SemesterCourseList.module.css'

const FACULTY_DOT = {
  cs:      styles.dotCs,
  math:    styles.dotMath,
  physics: styles.dotPhysics,
  misc:    styles.dotMisc,
}
const FACULTY_OPT_ACTIVE = {
  cs:      styles.optActiveCs,
  math:    styles.optActiveMath,
  physics: styles.optActivePhysics,
  misc:    styles.optActiveMisc,
}

function formatSlots(slots) {
  return slots.map(s => `${s.day[0].toUpperCase()}${s.day.slice(1, 3)} ${s.startHour}–${s.endHour}`).join('  ·  ')
}
function formatDate(dateStr) {
  if (!dateStr) return 'No exam'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? 'No exam' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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
              const isExpanded = expandedPanel?.courseId === p.courseId
              const canExpand = course.lectureOptions.length > 1 || (course.recitationOptions?.length ?? 0) > 0
              const score = scoreCourse(course, state.placed, state.exemptions, semesterId, state.filters, courseMap)
              const scoreTooltip = (() => {
                if (!score.critical && !score.warning) return 'No scheduling issues'
                const parts = []
                if (score.collisions > 0) parts.push(`${score.collisions} time collision${score.collisions > 1 ? 's' : ''}`)
                if (score.examSeparationMin >= 0 && score.examSeparationMin < state.filters.minExamSeparationDays + 3)
                  parts.push(`Exam gap: ${score.examSeparationMin}d (min ${state.filters.minExamSeparationDays}d)`)
                if (!score.prerequisitesMet && !state.filters.ignorePrerequisites) parts.push('Prerequisites not met')
                return parts.join(' · ') || 'Issues detected'
              })()

              return (
                <div key={p.courseId} data-testid={`${TEST_IDS.SEMESTER_COURSE_LIST.CHIP}-${p.courseId}`} className={styles.chip}>
                  <span className={cn(styles.dot, FACULTY_DOT[course.faculty])} />
                  <Tooltip text={scoreTooltip} side="top">
                    {score.critical
                      ? <AlertCircle size={10} className={cn(styles.statusIcon, styles.statusCritical)} />
                      : score.warning
                        ? <AlertTriangle size={10} className={cn(styles.statusIcon, styles.statusWarning)} />
                        : <CheckCircle2 size={10} className={cn(styles.statusIcon, styles.statusOk)} />
                    }
                  </Tooltip>

                  <div className={styles.chipText}>
                    <p className={styles.courseName}>{course.name}</p>
                    <p className={styles.courseCode}>{course.code}</p>
                  </div>

                  <span className={styles.examDate}>
                    {formatDate(course.examDate)}
                  </span>

                  {canExpand && (
                    <button
                      data-course-panel
                      data-testid={`${TEST_IDS.SEMESTER_COURSE_LIST.EXPAND_BUTTON}-${p.courseId}`}
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setExpandedPanel(isExpanded ? null : { courseId: p.courseId, rect })
                      }}
                      className={cn(styles.expandBtn, isExpanded && styles.expandBtnActive)}
                    >
                      <ChevronDown size={11} className={cn(styles.chevron, !isExpanded && styles.chevronCollapsed)} />
                    </button>
                  )}

                  <button
                    data-testid={`${TEST_IDS.SEMESTER_COURSE_LIST.REMOVE_BUTTON}-${p.courseId}`}
                    onClick={() => dispatch({ type: 'REMOVE_COURSE', courseId: p.courseId, semesterId })}
                    className={styles.removeBtn}
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
      {expandedPanel && panelCourse && panelPlaced && createPortal(
        <div
          data-course-panel
          className={styles.panel}
          style={{
            bottom: window.innerHeight - expandedPanel.rect.top + 8,
            left: Math.min(expandedPanel.rect.left, window.innerWidth - 260),
            minWidth: 240,
            maxHeight: Math.min(420, expandedPanel.rect.top - 12),
            overflowY: 'auto',
          }}
        >
          <p className={styles.panelTitle}>{panelCourse.name}</p>

          {panelCourse.lectureOptions.length > 0 && (
            <div className={styles.optGroup}>
              <p className={styles.optGroupLabel}>Lecture</p>
              <div className={styles.optList}>
                {panelCourse.lectureOptions.map(opt => (
                  <Tooltip key={opt.id} text={formatSlots(opt.slots)} side="top">
                    <button
                      onClick={() => dispatch({ type: 'SET_LECTURE_OPTION', courseId: expandedPanel.courseId, semesterId, optionId: opt.id })}
                      className={cn(
                        styles.optBtn,
                        panelPlaced.lectureOptionId === opt.id && FACULTY_OPT_ACTIVE[panelCourse.faculty]
                      )}
                    >
                      <span className={styles.optId}>{opt.id.toUpperCase()}</span>
                      {opt.slots.map((s, i) => (
                        <span key={i} className={styles.optSlot}>
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
              <p className={styles.optGroupLabel}>Recitation</p>
              <div className={styles.optList}>
                {panelCourse.recitationOptions.map(opt => (
                  <Tooltip key={opt.id} text={formatSlots(opt.slots)} side="top">
                    <button
                      onClick={() => dispatch({ type: 'SET_RECITATION_OPTION', courseId: expandedPanel.courseId, semesterId, optionId: opt.id })}
                      className={cn(
                        styles.optBtn,
                        panelPlaced.recitationOptionId === opt.id && FACULTY_OPT_ACTIVE[panelCourse.faculty]
                      )}
                    >
                      <span className={styles.optId}>{opt.id.toUpperCase()}</span>
                      {opt.slots.map((s, i) => (
                        <span key={i} className={styles.optSlot}>
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
