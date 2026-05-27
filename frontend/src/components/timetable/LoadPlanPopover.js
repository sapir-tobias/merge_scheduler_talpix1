import { cn } from './utils'
import { TRACK_IDS, TRACK_LABEL, TRACK_DESC, TRACK_DOT_COLOR } from './constants'
import { TEST_IDS } from '../../testIds'
import styles from '../../pages/Timetable/SchedulerPage.module.css'

export default function LoadPlanPopover({ loadPlanBtnRect, handleLoadPlan }) {
  return (
    <div
      data-load-plan-popover
      data-testid={TEST_IDS.LOAD_PLAN.POPOVER}
      className={cn(styles.popover, styles.popoverWide)}
      style={{ top: loadPlanBtnRect.bottom + 8, right: window.innerWidth - loadPlanBtnRect.right }}
    >
      <p className={styles.popoverTitleTight}>Load Default Plan</p>
      <p className={styles.popoverSubtitle}>
        Replaces your current plan. Exempt courses are skipped automatically.
      </p>

      <div className={styles.trackStack}>
        {TRACK_IDS.map(track => (
          <button
            key={track}
            data-testid={`${TEST_IDS.LOAD_PLAN.TRACK_OPTION}-${track}`}
            onClick={() => handleLoadPlan(track)}
            className={styles.trackBtn}
          >
            <div className={styles.trackDot} style={{ backgroundColor: TRACK_DOT_COLOR[track] }} />
            <div>
              <p className={styles.trackName}>{TRACK_LABEL[track]}</p>
              <p className={styles.trackDesc}>{TRACK_DESC[track]}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
