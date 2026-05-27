import { cn } from '../../utils/utils'
import { LuLock, LuLockOpen, LuX } from 'react-icons/lu'
import { blockStyle } from '../../utils/weeklyLayout'

export function LectureBlock({
  block,
  styles,
  facultyColors,
  facultyBtn,
  facultiesFilter,
  semesterId,
  dispatch,
  onSelect,
  TEST_IDS,
}) {
  return (
    <div
      data-testid={`${TEST_IDS.WEEKLY.COURSE_BLOCK}-${block.courseId}`}
      className={cn(
        styles.courseBlock,
        facultyColors[block.faculty]
      )}
      style={{ ...blockStyle(block.startHour, block.endHour, block.dayIndex), opacity: facultiesFilter.has(block.faculty) ? 1 : 0.18 }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation()
        onSelect({ courseId: block.courseId, rect: e.currentTarget.getBoundingClientRect() })
      }}
    >
      <div className={styles.courseBlockHeader}>
        <div className={styles.courseBlockText}>
          <p className={styles.courseName}>{block.label}</p>
          <p className={styles.courseCode}>{block.code}</p>
        </div>
        <div className={styles.courseActions}>
          <button
            data-testid={`${TEST_IDS.WEEKLY.LOCK_BUTTON}-${block.courseId}`}
            onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_LOCK', courseId: block.courseId, semesterId }) }}
            className={cn(styles.actionBtn, facultyBtn[block.faculty])}
          >
            {block.locked ? <LuLock size={10} /> : <LuLockOpen size={10} />}
          </button>
          <button
            data-testid={`${TEST_IDS.WEEKLY.REMOVE_BUTTON}-${block.courseId}`}
            onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE_COURSE', courseId: block.courseId, semesterId }) }}
            className={styles.removeBtn}
          >
            <LuX size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function RecitationBlock({
  block,
  styles,
  facultyColors,
  facultiesFilter,
  onSelect,
  TEST_IDS,
}) {
  return (
    <div
      data-testid={`${TEST_IDS.WEEKLY.COURSE_BLOCK}-${block.courseId}`}
      className={cn(
        styles.recitationBlock,
        facultyColors[block.faculty]
      )}
      style={{
        ...blockStyle(block.startHour, block.endHour, block.dayIndex),
        borderStyle: 'dashed',
        borderWidth: '1.5px',
        opacity: facultiesFilter.has(block.faculty) ? 0.85 : 0.18,
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.stopPropagation()
        onSelect({ courseId: block.courseId, rect: e.currentTarget.getBoundingClientRect() })
      }}
    >
      <p className={styles.recitationLabel}>
        <span className={styles.recitationTag}>Rec</span> {block.label}
      </p>
    </div>
  )
}
