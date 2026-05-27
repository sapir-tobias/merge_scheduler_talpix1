import { cn } from './utils'
import { DAYS_LIST } from './constants'
import { TEST_IDS } from '../../testIds'
import styles from '../../pages/Timetable/SchedulerPage.module.css'

function formatTime(h) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

export default function BlockerPopover({
  blockerBtnRect,
  newBlocker,
  setNewBlocker,
  blockerLabel,
  setBlockerLabel,
  handleAddBlocker,
}) {
  return (
    <div
      data-blocker-popover
      data-testid={TEST_IDS.BLOCK_POPOVER.CONTAINER}
      className={styles.popover}
      style={{ top: blockerBtnRect.bottom + 8, right: window.innerWidth - blockerBtnRect.right }}
    >
      <p className={styles.popoverTitle}>Add time blocker</p>

      <div className={styles.fieldStack}>
        <div>
          <p className={styles.fieldLabel}>Day</p>
          <div className={styles.dayRow}>
            {DAYS_LIST.map(d => (
              <button
                key={d.key}
                data-testid={`${TEST_IDS.BLOCK_POPOVER.DAY_OPTION}-${d.key}`}
                onClick={() => setNewBlocker(nb => ({ ...nb, day: d.key }))}
                className={cn(styles.dayBtn, newBlocker.day === d.key && styles.dayBtnActive)}
              >
                {d.label.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={styles.fieldLabel}>
            From — <span className={styles.fieldValue}>{formatTime(newBlocker.startHour)}</span>
          </p>
          <input
            type="range" min={8} max={19.5} step={0.5}
            data-testid={TEST_IDS.BLOCK_POPOVER.START_SLIDER}
            value={newBlocker.startHour}
            onChange={e => setNewBlocker(nb => ({ ...nb, startHour: +e.target.value, endHour: Math.max(+e.target.value + 0.5, nb.endHour) }))}
            className={styles.range}
          />
        </div>
        <div>
          <p className={styles.fieldLabel}>
            To — <span className={styles.fieldValue}>{formatTime(newBlocker.endHour)}</span>
          </p>
          <input
            type="range" min={newBlocker.startHour + 0.5} max={20} step={0.5}
            data-testid={TEST_IDS.BLOCK_POPOVER.END_SLIDER}
            value={newBlocker.endHour}
            onChange={e => setNewBlocker(nb => ({ ...nb, endHour: +e.target.value }))}
            className={styles.range}
          />
        </div>

        <div>
          <p className={styles.fieldLabel}>Label (optional)</p>
          <input
            type="text"
            data-testid={TEST_IDS.BLOCK_POPOVER.LABEL_INPUT}
            value={blockerLabel}
            onChange={e => setBlockerLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddBlocker()}
            placeholder="e.g. Gym, Class, Sleep…"
            className={styles.textInput}
          />
        </div>

        <button
          data-testid={TEST_IDS.BLOCK_POPOVER.ADD_BUTTON}
          onClick={handleAddBlocker}
          className={styles.primaryBtn}
        >
          Add blocker
        </button>
      </div>
    </div>
  )
}
