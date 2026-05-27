import { cn } from './utils'
import { LuX, LuGripVertical, LuTriangleAlert, LuCircleAlert, LuCircleCheck, LuChevronDown } from 'react-icons/lu'
import Tooltip from './Tooltip'

export function SemesterHealthBadge({ semStatus, semIssues, styles }) {
  return (
    <Tooltip text={semIssues.length > 0 ? semIssues.join(' · ') : 'No issues'} side="top">
      {semStatus === 'critical'
        ? <LuCircleAlert size={11} className={cn(styles.statusIcon, styles.statusCritical)} />
        : semStatus === 'warning'
          ? <LuTriangleAlert size={11} className={cn(styles.statusIcon, styles.statusWarning)} />
          : <LuCircleCheck size={11} className={cn(styles.statusIcon, styles.statusOk)} />
      }
    </Tooltip>
  )
}

export default function SemesterBoxBody({
  placed,
  courseMap,
  semesterId,
  allPlaced,
  exemptions,
  expandedCourseId,
  setExpandedCourseId,
  onAddPrereq,
  dispatch,
  styles,
  facultyPill,
  TEST_IDS,
}) {
  return (
    <>
      {placed.map(p => {
        const course = courseMap.get(p.courseId)
        if (!course) return null
        const isExpanded = expandedCourseId === p.courseId
        const satisfied = new Set([
          ...allPlaced.filter(pl => pl.semesterId < semesterId).map(pl => pl.courseId),
          ...exemptions,
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
              <LuGripVertical size={10} className={styles.grip} />
              <span className={cn(styles.pill, facultyPill[course.faculty])}>
                {course.code}
              </span>
              <span
                className={styles.chipName}
                onClick={e => { e.stopPropagation(); setExpandedCourseId(isExpanded ? null : p.courseId) }}
              >
                {course.name}
              </span>
              <LuChevronDown
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
                <LuX size={10} />
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
                            onClick={isMet ? undefined : () => onAddPrereq(reqId)}
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
}
