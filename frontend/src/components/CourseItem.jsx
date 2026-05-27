import { useState } from 'react'
import { AlertTriangle, AlertOctagon, ChevronDown, ChevronUp, Plus, Check, ArrowRight, GripVertical } from 'lucide-react'
import { cn } from '../lib/utils'
import Tooltip from './Tooltip'
import { useCoursesStore } from '../stores/CoursesStore'
import { TEST_IDS } from '../testIds'
import { FACULTY_LABEL, TERM_LABEL } from '../constants'
import CourseItemDetail from './scheduler/CourseItemDetail'
import styles from './CourseItem.module.css'

const FACULTY_BADGE = {
  cs:      styles.badgeCs,
  math:    styles.badgeMath,
  physics: styles.badgePhysics,
  misc:    styles.badgeMisc,
}

export default function CourseItem({ course, scoreInfo, added, addedToCurrentSem, onAdd, draggable }) {
  const { courseMap } = useCoursesStore()
  const [expanded, setExpanded] = useState(false)
  // Prefer the catalogue course name; fall back to the serializer-provided
  // prerequisite name; only then to the bare course number.
  const prereqNames = course.prerequisites.map(
    id => courseMap.get(id)?.name ?? course.prerequisiteNames?.[id] ?? id
  )

  return (
    <div
      data-testid={`${TEST_IDS.COURSE_ITEM.ROW}-${course.id}`}
      className={cn(
        styles.root,
        scoreInfo.critical && !addedToCurrentSem && styles.critical,
        draggable && styles.draggable
      )}
      draggable={draggable}
      onDragStart={draggable ? e => {
        e.dataTransfer.setData('courseId', course.id)
        e.dataTransfer.setData('source', 'catalogue')
      } : undefined}
    >
      {/* Slim row */}
      <div className={styles.row}>
        {draggable && (
          <GripVertical size={11} className={styles.grip} />
        )}

        <span className={cn(styles.badge, FACULTY_BADGE[course.faculty])}>
          {FACULTY_LABEL[course.faculty]}
        </span>

        <div className={styles.info}>
          <p className={styles.name}>{course.name}</p>
          <p className={styles.meta}>
            {course.code} · {course.credits} cr
            {course.term && TERM_LABEL[course.term] ? ` · ${TERM_LABEL[course.term]}` : ''}
            {course.mandatoryAttendance ? ' · נ״ח' : ''}
          </p>
        </div>

        <div className={styles.actions}>
          {scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Critical: scheduling breach" className={styles.shrink0}>
              <AlertOctagon size={13} className={styles.iconCritical} />
            </Tooltip>
          )}
          {scoreInfo.warning && !scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Minor scheduling issue" className={styles.shrink0}>
              <AlertTriangle size={13} className={styles.iconWarning} />
            </Tooltip>
          )}

          <button
            data-testid={`${TEST_IDS.COURSE_ITEM.EXPAND_BUTTON}-${course.id}`}
            onClick={() => setExpanded(e => !e)}
            className={styles.expandBtn}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {onAdd && (
            <Tooltip
              text={added && !addedToCurrentSem ? 'Move to this semester' : addedToCurrentSem ? 'Already here' : 'Add to schedule'}
              className={styles.shrink0}
            >
              <button
                data-testid={`${TEST_IDS.COURSE_ITEM.ADD_BUTTON}-${course.id}`}
                onClick={onAdd}
                disabled={addedToCurrentSem}
                className={cn(
                  styles.addBtn,
                  addedToCurrentSem
                    ? styles.addBtnHere
                    : added
                      ? styles.addBtnMove
                      : styles.addBtnNew
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
        <CourseItemDetail
          course={course}
          scoreInfo={scoreInfo}
          prereqNames={prereqNames}
        />
      )}
    </div>
  )
}
