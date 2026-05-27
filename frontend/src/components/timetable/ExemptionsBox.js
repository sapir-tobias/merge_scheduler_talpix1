import { useState } from 'react'
import { useDegree } from '../../stores/DegreeContext'
import { useCoursesStore } from '../../stores/CoursesStore'
import { cn } from '../../utils/utils'
import { TEST_IDS } from '../../testIds'
import { LuX, LuGripVertical, LuShieldCheck } from 'react-icons/lu'
import styles from './ExemptionsBox.module.css'

const FACULTY_PILL = {
  cs:       styles.pillCs,
  math:     styles.pillMath,
  physics:  styles.pillPhysics,
  misc:     styles.pillMisc,
}

export default function ExemptionsBox() {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    const courseId = e.dataTransfer.getData('courseId')
    const source   = e.dataTransfer.getData('source')
    if (!courseId) return

    if (source === 'semester') {
      const fromSem = parseInt(e.dataTransfer.getData('fromSem'))
      dispatch({ type: 'REMOVE_COURSE', courseId, semesterId: fromSem })
    }
    // ADD_EXEMPTION also removes from placed automatically
    dispatch({ type: 'ADD_EXEMPTION', courseId })
    setDragOver(false)
  }

  return (
    <div
      data-testid={TEST_IDS.EXEMPTIONS.CONTAINER}
      className={cn(
        styles.container,
        dragOver ? styles.containerDragOver : styles.containerIdle
      )}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className={styles.header}>
        <LuShieldCheck size={13} className={styles.headerIcon} />
        <span className={styles.headerTitle}>
          Exemptions
        </span>
      </div>

      {/* Help text */}
      <p className={styles.helpText}>
        Drop courses here to treat them as already completed — they satisfy prerequisites in all semesters.
      </p>
      <div className={styles.divider} />

      {/* Course list */}
      <div className={styles.list}>
        {state.exemptions.length === 0 && (
          <p className={styles.empty}>
            No exemptions yet
          </p>
        )}
        {state.exemptions.map(courseId => {
          const course = courseMap.get(courseId)
          if (!course) return null
          return (
            <div
              key={courseId}
              data-testid={`${TEST_IDS.EXEMPTIONS.CHIP}-${courseId}`}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('courseId', courseId)
                e.dataTransfer.setData('source', 'exemptions')
              }}
              className={styles.chip}
            >
              <LuGripVertical size={10} className={styles.grip} />
              <span className={cn(styles.code, FACULTY_PILL[course.faculty])}>
                {course.code}
              </span>
              <span className={styles.name}>{course.name}</span>
              <button
                data-testid={`${TEST_IDS.EXEMPTIONS.REMOVE_BUTTON}-${courseId}`}
                onClick={() => dispatch({ type: 'REMOVE_EXEMPTION', courseId })}
                className={styles.removeBtn}
              >
                <LuX size={10} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Drop hint when dragging over */}
      {dragOver && (
        <div className={styles.dropHint}>
          <p className={styles.dropHintText}>Drop to exempt</p>
        </div>
      )}
    </div>
  )
}
