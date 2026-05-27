import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import Tooltip from '../Tooltip'
import { TEST_IDS } from '../../testIds'
import { exportPlan, importPlanFile } from '../../lib/planIO'

/** Import / Export plan controls (JSON), backed by a hidden file input. */
export default function SchedulerIOButtons({ state, dispatch, styles }) {
  const importInputRef = useRef(null)
  return (
    <div className={styles.ioGroup}>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        onChange={e => importPlanFile(e, dispatch)}
        style={{ display: 'none' }}
        data-testid={TEST_IDS.NAV.IMPORT_INPUT}
      />
      <Tooltip text="Import plan (JSON)" side="bottom">
        <button
          className={styles.navBtn}
          data-testid={TEST_IDS.NAV.IMPORT_BUTTON}
          onClick={() => importInputRef.current?.click()}
        >
          <Upload size={13} />
          Import
        </button>
      </Tooltip>
      <Tooltip text="Export plan (JSON)" side="bottom">
        <button
          className={styles.navBtn}
          data-testid={TEST_IDS.NAV.EXPORT_BUTTON}
          onClick={() => exportPlan(state)}
        >
          <Download size={13} />
          Export
        </button>
      </Tooltip>
    </div>
  )
}
