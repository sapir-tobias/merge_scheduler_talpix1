import { useState } from 'react'
import { LuTriangleAlert, LuOctagonAlert, LuChevronDown, LuChevronUp, LuPlus, LuCheck, LuArrowRight, LuGripVertical } from 'react-icons/lu'
import { cn } from '../../utils/utils'
import Tooltip from './Tooltip'
import { useCoursesStore } from '../../stores/CoursesStore'
import { TEST_IDS } from '../../testIds'
import { FACULTY_LABEL, TERM_LABEL } from '../../constants'
import CourseItemDetail from './CourseItemDetail'
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
  // Resolve each prereq's name (catalogue -> serializer map -> bare id) and
  // whether it's actually offered this year (so we can flag the un-takeable ones).
  const prereqInfo = course.prerequisites.map(id => ({
    name: courseMap.get(id)?.name ?? course.prerequisiteNames?.[id] ?? id,
    offered: courseMap.has(id),
  }))

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
          <LuGripVertical size={11} className={styles.grip} />
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
              <LuOctagonAlert size={13} className={styles.iconCritical} />
            </Tooltip>
          )}
          {scoreInfo.warning && !scoreInfo.critical && !addedToCurrentSem && (
            <Tooltip text="Minor scheduling issue" className={styles.shrink0}>
              <LuTriangleAlert size={13} className={styles.iconWarning} />
            </Tooltip>
          )}

          <button
            data-testid={`${TEST_IDS.COURSE_ITEM.EXPAND_BUTTON}-${course.id}`}
            onClick={() => setExpanded(e => !e)}
            className={styles.expandBtn}
          >
            {expanded ? <LuChevronUp size={13} /> : <LuChevronDown size={13} />}
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
                {addedToCurrentSem ? <LuCheck size={11} /> : added ? <LuArrowRight size={11} /> : <LuPlus size={11} />}
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
          prereqInfo={prereqInfo}
        />
      )}
    </div>
  )
}
