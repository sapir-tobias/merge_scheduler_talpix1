import { cn } from './utils'
import { LuX } from 'react-icons/lu'
import { DAYS, blockStyle } from './weeklyLayout'

export default function BlockerBlock({
  blocker,
  disp,
  dragging,
  editingBlockerId,
  setEditingBlockerId,
  dispatch,
  startMoveDrag,
  startResizeDrag,
  styles,
  TEST_IDS,
}) {
  const dayIndex = DAYS.findIndex(d => d.key === disp.day)
  if (dayIndex < 0) return null

  return (
    <div
      data-testid={`${TEST_IDS.WEEKLY.BLOCKER}-${blocker.id}`}
      className={cn(styles.blocker, dragging && styles.blockerDragging)}
      style={{
        ...blockStyle(disp.startHour, disp.endHour, dayIndex),
        background: 'linear-gradient(to bottom, rgba(220,220,218,0.18) 0%, rgba(168,162,158,0.22) 55%, rgba(100,95,90,0.32) 88%, rgba(60,55,50,0.44) 100%)',
        border: '1.5px solid rgba(41,37,36,0.55)',
        cursor: 'grab',
      }}
      onMouseDown={e => startMoveDrag(e, blocker)}
    >
      <div
        className={styles.blockerSheen}
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(100,95,90,0.15)' }}
      />
      {editingBlockerId === blocker.id ? (
        <input
          autoFocus
          type="text"
          defaultValue={blocker.label ?? ''}
          onMouseDown={e => e.stopPropagation()}
          onBlur={e => {
            dispatch({ type: 'UPDATE_BLOCKER', id: blocker.id, updates: { label: e.target.value || undefined } })
            setEditingBlockerId(null)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setEditingBlockerId(null)
          }}
          className={styles.blockerInput}
          style={{ color: 'rgba(80,75,70,0.9)' }}
        />
      ) : (
        <p
          className={styles.blockerLabel}
          style={{ color: 'rgba(80,75,70,0.65)' }}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); setEditingBlockerId(blocker.id) }}
        >
          {blocker.label || 'blocked'}
        </p>
      )}
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE_BLOCKER', id: blocker.id }) }}
        className={styles.blockerRemove}
        style={{ color: 'rgba(80,75,70,0.7)' }}
      >
        <LuX size={9} />
      </button>
      <div
        className={styles.blockerResize}
        style={{ cursor: 'ns-resize' }}
        onMouseDown={e => startResizeDrag(e, blocker)}
      >
        <div className={styles.blockerResizeHandle} style={{ backgroundColor: 'rgba(80,75,70,0.4)' }} />
      </div>
    </div>
  )
}
