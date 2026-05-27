import { cn } from '../../lib/utils'
import {
  DAYS,
  START_HOUR,
  TOTAL_HOURS,
  HOUR_HEIGHT,
  formatHour,
  blockStyle,
  COLLISION_STRIPE,
} from '../../lib/weeklyLayout'
import { LectureBlock, RecitationBlock } from './CourseBlock'
import BlockerBlock from './BlockerBlock'

export default function ScheduleGrid({
  hourSlots,
  todayKey,
  semBlockers,
  allCourseBlocks,
  collisionZones,
  blockerCollisionZones,
  dragRender,
  getBlockerDisplay,
  editingBlockerId,
  setEditingBlockerId,
  startMoveDrag,
  startResizeDrag,
  facultyColors,
  facultyBtn,
  facultiesFilter,
  semesterId,
  dispatch,
  setPanel,
  styles,
  TEST_IDS,
}) {
  return (
    <div className={styles.gridInner} style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>

      {/* Hour grid lines + labels */}
      {hourSlots.map(h => (
        <div
          key={h}
          className={styles.hourRow}
          style={{ top: `${((h - START_HOUR) / TOTAL_HOURS) * 100}%` }}
        >
          <div className={styles.hourGutter}>
            <span className={styles.hourLabel}>
              {formatHour(h)}
            </span>
          </div>
          {DAYS.map((day, i) => (
            <div
              key={day.key}
              className={cn(
                styles.hourCell,
                i === 0 && styles.hourCellFirst,
                day.key === todayKey && styles.hourCellToday
              )}
              style={{ height: `${HOUR_HEIGHT}px` }}
            />
          ))}
        </div>
      ))}

      {/* Blockers */}
      {semBlockers.map(blocker => {
        const disp = getBlockerDisplay(blocker)
        const dragging = (dragRender.type === 'moving' || dragRender.type === 'resizing') && dragRender.id === blocker.id
        return (
          <BlockerBlock
            key={blocker.id}
            blocker={blocker}
            disp={disp}
            dragging={dragging}
            editingBlockerId={editingBlockerId}
            setEditingBlockerId={setEditingBlockerId}
            dispatch={dispatch}
            startMoveDrag={startMoveDrag}
            startResizeDrag={startResizeDrag}
            styles={styles}
            TEST_IDS={TEST_IDS}
          />
        )
      })}

      {/* Course blocks — lectures */}
      {allCourseBlocks.filter(b => !b.isRecitation).map(block => (
        <LectureBlock
          key={block.key}
          block={block}
          styles={styles}
          facultyColors={facultyColors}
          facultyBtn={facultyBtn}
          facultiesFilter={facultiesFilter}
          semesterId={semesterId}
          dispatch={dispatch}
          onSelect={setPanel}
          TEST_IDS={TEST_IDS}
        />
      ))}

      {/* Recitation blocks — dashed border, "Rec" label */}
      {allCourseBlocks.filter(b => b.isRecitation).map(block => (
        <RecitationBlock
          key={block.key}
          block={block}
          styles={styles}
          facultyColors={facultyColors}
          facultiesFilter={facultiesFilter}
          onSelect={setPanel}
          TEST_IDS={TEST_IDS}
        />
      ))}

      {/* Course-course collision overlays */}
      {collisionZones.map((zone, i) => (
        <div
          key={`col-${i}`}
          className={styles.collisionZone}
          style={{ ...blockStyle(zone.startHour, zone.endHour, zone.dayIndex), ...COLLISION_STRIPE }}
        />
      ))}

      {/* Course-blocker collision overlays */}
      {blockerCollisionZones.map((zone, i) => (
        <div
          key={`bcol-${i}`}
          className={styles.collisionZone}
          style={{ ...blockStyle(zone.startHour, zone.endHour, zone.dayIndex), ...COLLISION_STRIPE }}
        />
      ))}
    </div>
  )
}
