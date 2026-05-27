import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import { TEST_IDS } from '../testIds'
import styles from './WeeklySchedule.module.css'
import {
  DAYS,
  DAY_OF_WEEK,
  START_HOUR,
  TOTAL_HOURS,
  buildCourseBlocks,
  computeCollisionZones,
  computeBlockerCollisionZones,
} from '../lib/weeklyLayout'
import { useBlockerDrag } from '../lib/useBlockerDrag'
import ScheduleGrid from './scheduler/ScheduleGrid'
import LectureOptionPanel from './scheduler/LectureOptionPanel'

const FACULTY_COLORS = {
  cs:      styles.facultyCs,
  math:    styles.facultyMath,
  physics: styles.facultyPhysics,
  misc:    styles.facultyMisc,
}
const FACULTY_BTN = {
  cs:      styles.btnCs,
  math:    styles.btnMath,
  physics: styles.btnPhysics,
  misc:    styles.btnMisc,
}

export default function WeeklySchedule({ semesterId }) {
  const { state, dispatch } = useDegree()
  const { courseMap } = useCoursesStore()
  const todayKey = DAY_OF_WEEK[new Date().getDay()]
  const scrollRef = useRef(null)

  const { dragRender, getBlockerDisplay, startMoveDrag, startResizeDrag } = useBlockerDrag(scrollRef, dispatch)

  const [panel, setPanel] = useState(null)
  const [editingBlockerId, setEditingBlockerId] = useState(null)

  useEffect(() => {
    if (!panel) return
    const timer = setTimeout(() => {
      const dismiss = () => setPanel(null)
      document.addEventListener('click', dismiss)
      return () => document.removeEventListener('click', dismiss)
    }, 0)
    return () => clearTimeout(timer)
  }, [panel])

  const semPlaced = state.placed.filter(p => p.semesterId === semesterId)
  const semBlockers = state.blockers.filter(b => b.semesterId === semesterId)

  const allCourseBlocks = buildCourseBlocks(semPlaced, courseMap)

  const collisionZones = computeCollisionZones(allCourseBlocks)
  const blockerCollisionZones = computeBlockerCollisionZones(allCourseBlocks, semBlockers, getBlockerDisplay)

  const hourSlots = Array.from({ length: TOTAL_HOURS }, (_, i) => i + START_HOUR)
  const panelCourse = panel ? courseMap.get(panel.courseId) : null
  const panelPlaced = panel ? semPlaced.find(p => p.courseId === panel.courseId) : null

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.timeGutter} />
        {DAYS.map(day => (
          <div
            key={day.key}
            className={cn(styles.dayHeader, day.key === todayKey && styles.dayHeaderToday)}
            title={day.key === todayKey ? 'Today' : undefined}
          >
            <span className={cn(styles.dayLabel, day.key === todayKey && styles.dayLabelToday)}>
              {day.label}{day.key === todayKey ? ' •' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div
        ref={scrollRef}
        data-testid={TEST_IDS.WEEKLY.GRID}
        className={styles.grid}
        style={{ cursor: dragRender.type !== 'none' ? 'grabbing' : 'default' }}
      >
        <ScheduleGrid
          hourSlots={hourSlots}
          todayKey={todayKey}
          semBlockers={semBlockers}
          allCourseBlocks={allCourseBlocks}
          collisionZones={collisionZones}
          blockerCollisionZones={blockerCollisionZones}
          dragRender={dragRender}
          getBlockerDisplay={getBlockerDisplay}
          editingBlockerId={editingBlockerId}
          setEditingBlockerId={setEditingBlockerId}
          startMoveDrag={startMoveDrag}
          startResizeDrag={startResizeDrag}
          facultyColors={FACULTY_COLORS}
          facultyBtn={FACULTY_BTN}
          facultiesFilter={state.filters.faculties}
          semesterId={semesterId}
          dispatch={dispatch}
          setPanel={setPanel}
          styles={styles}
          TEST_IDS={TEST_IDS}
        />
      </div>

      {/* Option panel portal */}
      {panel && panelCourse && panelPlaced && createPortal(
        <LectureOptionPanel
          panel={panel}
          panelCourse={panelCourse}
          panelPlaced={panelPlaced}
          semesterId={semesterId}
          dispatch={dispatch}
          setPanel={setPanel}
          styles={styles}
          TEST_IDS={TEST_IDS}
        />,
        document.body
      )}
    </div>
  )
}
