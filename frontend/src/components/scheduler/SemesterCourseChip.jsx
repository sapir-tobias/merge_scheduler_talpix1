import { createPortal } from 'react-dom'
import { X, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import Tooltip from '../Tooltip'
import styles from '../SemesterCourseList.module.css'

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

export default function SemesterCourseChip({
  placed,
  course,
  score,
  semesterId,
  isExpanded,
  onToggleExpand,
  dispatch,
  filters,
  TEST_IDS,
}) {
  const canExpand = course.lectureOptions.length > 1 || (course.recitationOptions?.length ?? 0) > 0
  const scoreTooltip = (() => {
    if (!score.critical && !score.warning) return 'No scheduling issues'
    const parts = []
    if (score.collisions > 0) parts.push(`${score.collisions} time collision${score.collisions > 1 ? 's' : ''}`)
    if (score.examSeparationMin >= 0 && score.examSeparationMin < filters.minExamSeparationDays + 3)
      parts.push(`Exam gap: ${score.examSeparationMin}d (min ${filters.minExamSeparationDays}d)`)
    if (!score.prerequisitesMet && !filters.ignorePrerequisites) parts.push('Prerequisites not met')
    return parts.join(' · ') || 'Issues detected'
  })()

  return (
    <div data-testid={`${TEST_IDS.SEMESTER_COURSE_LIST.CHIP}-${placed.courseId}`} className={styles.chip}>
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
          data-testid={`${TEST_IDS.SEMESTER_COURSE_LIST.EXPAND_BUTTON}-${placed.courseId}`}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect()
            onToggleExpand(isExpanded ? null : { courseId: placed.courseId, rect })
          }}
          className={cn(styles.expandBtn, isExpanded && styles.expandBtnActive)}
        >
          <ChevronDown size={11} className={cn(styles.chevron, !isExpanded && styles.chevronCollapsed)} />
        </button>
      )}

      <button
        data-testid={`${TEST_IDS.SEMESTER_COURSE_LIST.REMOVE_BUTTON}-${placed.courseId}`}
        onClick={() => dispatch({ type: 'REMOVE_COURSE', courseId: placed.courseId, semesterId })}
        className={styles.removeBtn}
      >
        <X size={11} />
      </button>
    </div>
  )
}

export function SemesterCourseOptionsPanel({ expandedPanel, panelCourse, panelPlaced, semesterId, dispatch }) {
  if (!expandedPanel || !panelCourse || !panelPlaced) return null
  return createPortal(
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
  )
}
