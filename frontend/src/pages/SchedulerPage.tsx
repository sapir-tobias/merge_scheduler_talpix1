import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import SemesterPage from './SemesterPage'
import DegreePlanPage from './DegreePlanPage'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import Tooltip from '../components/Tooltip'
import { Download, Upload, Ban, BookOpen } from 'lucide-react'
import type { SemesterId, PlanYear, DayKey, TrackId } from '../types'
import { TEST_IDS } from '../testIds'
import styles from './SchedulerPage.module.css'

type View = 'plan' | 'semA' | 'semB'

function formatTime(h: number) {
  const hour = Math.floor(h)
  const min = h % 1 === 0.5 ? '30' : '00'
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${display}:${min}${suffix}`
}

const DAYS_LIST: { key: DayKey; label: string }[] = [
  { key: 'sun', label: 'Sunday' },
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
]

const TRACK_LABEL: Record<TrackId, string> = {
  cs:      'Computer Science',
  math:    'Mathematics',
  physics: 'Physics',
}
const TRACK_DESC: Record<TrackId, string> = {
  cs:      '6 semesters · algorithms, OS, networks, AI',
  math:    '6 semesters · analysis, algebra, statistics, QM',
  physics: '6 semesters · mechanics, E&M, quantum, thermo',
}
const TRACK_DOT_COLOR: Record<TrackId, string> = {
  cs:      '#60a5fa',
  math:    '#a78bfa',
  physics: '#fbbf24',
}

const TAB_TEST_ID: Record<View, string> = {
  plan: TEST_IDS.NAV.TAB_PLAN,
  semA: TEST_IDS.NAV.TAB_SEM_A,
  semB: TEST_IDS.NAV.TAB_SEM_B,
}

export default function SchedulerPage() {
  const { state, dispatch } = useDegree()
  const { fetchPlan } = useCoursesStore()
  const [view, setView] = useState<View>('plan')
  const [year, setYear] = useState<PlanYear>(1)

  // Blocker popover
  const [blockerOpen, setBlockerOpen] = useState(false)
  const [newBlocker, setNewBlocker] = useState({ day: 'sun' as DayKey, startHour: 9, endHour: 11 })
  const [blockerLabel, setBlockerLabel] = useState('')
  const blockerBtnRef = useRef<HTMLButtonElement>(null)

  // Load Plan popover
  const [loadPlanOpen, setLoadPlanOpen] = useState(false)
  const loadPlanBtnRef = useRef<HTMLButtonElement>(null)

  // Hidden file input backing the Import button
  const importInputRef = useRef<HTMLInputElement>(null)

  const activeSems: [SemesterId, SemesterId] =
    year === 1 ? [1, 2] : year === 2 ? [3, 4] : [5, 6]

  const TABS = [
    { id: 'plan' as View, label: 'Degree Plan' },
    { id: 'semA' as View, label: `Semester ${activeSems[0]}` },
    { id: 'semB' as View, label: `Semester ${activeSems[1]}` },
  ]

  function handleAddBlocker() {
    if (newBlocker.endHour <= newBlocker.startHour) return
    const semId: SemesterId = view === 'semB' ? activeSems[1] : activeSems[0]
    dispatch({ type: 'ADD_BLOCKER', payload: { id: `b-${Date.now()}`, label: blockerLabel || undefined, ...newBlocker, semesterId: semId } })
    setBlockerLabel('')
    setBlockerOpen(false)
  }

  async function handleLoadPlan(track: TrackId) {
    const entries = await fetchPlan(track)
    const placed = entries
      .filter(e => !state.exemptions.includes(e.courseId))
      .map(e => ({ ...e, locked: false }))
    dispatch({ type: 'LOAD_PLAN', placed })
    setLoadPlanOpen(false)
  }

  // Export the full plan (placement + exemptions + blockers) as a JSON file.
  function handleExport() {
    const payload = JSON.stringify(
      { placed: state.placed, exemptions: state.exemptions, blockers: state.blockers },
      null,
      2,
    )
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'degree-plan.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Restore a previously exported plan from a JSON file.
  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        dispatch({ type: 'LOAD_PLAN', placed: Array.isArray(parsed.placed) ? parsed.placed : [] })
        for (const id of parsed.exemptions ?? []) dispatch({ type: 'ADD_EXEMPTION', courseId: id })
        for (const b of parsed.blockers ?? []) dispatch({ type: 'ADD_BLOCKER', payload: b })
      } catch {
        // ignore malformed files — nothing to restore
      }
    }
    reader.readAsText(file)
    e.target.value = ''  // allow re-importing the same file
  }

  // Dismiss blocker popover on outside click
  useEffect(() => {
    if (!blockerOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-blocker-popover]')) setBlockerOpen(false)
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [blockerOpen])

  // Dismiss load plan popover on outside click
  useEffect(() => {
    if (!loadPlanOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-load-plan-popover]')) setLoadPlanOpen(false)
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [loadPlanOpen])

  const blockerBtnRect = blockerBtnRef.current?.getBoundingClientRect()
  const loadPlanBtnRect = loadPlanBtnRef.current?.getBoundingClientRect()

  return (
    <div className={styles.app}>
      <nav className={styles.nav} data-testid={TEST_IDS.NAV.CONTAINER}>
        <span className={styles.brand} data-testid={TEST_IDS.NAV.BRAND}>
          Degree Planner
        </span>

        {/* View tabs */}
        <div className={styles.segmented}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              data-testid={TAB_TEST_ID[tab.id]}
              onClick={() => setView(tab.id)}
              className={cn(styles.tab, view === tab.id && styles.tabActive)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year selector */}
        <div className={styles.yearGroup} data-testid={TEST_IDS.NAV.YEAR_SELECT}>
          <span className={styles.yearLabel}>Year</span>
          <div className={styles.segmented}>
            {([1, 2, 3] as PlanYear[]).map(y => (
              <button
                key={y}
                data-testid={`${TEST_IDS.NAV.YEAR_OPTION}-${y}`}
                onClick={() => setYear(y)}
                className={cn(styles.yearBtn, year === y && styles.tabActive)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.spacer} />

        {/* Block button */}
        <div className={styles.navGroup}>
          <Tooltip text="Add a time blocker" side="bottom">
            <button
              ref={blockerBtnRef}
              data-blocker-popover
              data-testid={TEST_IDS.NAV.BLOCK_BUTTON}
              onClick={() => setBlockerOpen(o => !o)}
              className={cn(styles.navBtn, blockerOpen && styles.navBtnActive)}
            >
              <Ban size={12} />
              Block
            </button>
          </Tooltip>

          {blockerOpen && blockerBtnRect && createPortal(
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
            </div>,
            document.body
          )}
        </div>

        {/* Load Plan button */}
        <div className={styles.navGroup}>
          <Tooltip text="Load a default degree track" side="bottom">
            <button
              ref={loadPlanBtnRef}
              data-load-plan-popover
              data-testid={TEST_IDS.NAV.LOAD_PLAN_BUTTON}
              onClick={() => setLoadPlanOpen(o => !o)}
              className={cn(styles.navBtn, loadPlanOpen && styles.navBtnActive)}
            >
              <BookOpen size={12} />
              Load Plan
            </button>
          </Tooltip>

          {loadPlanOpen && loadPlanBtnRect && createPortal(
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
                {(['cs', 'math', 'physics'] as TrackId[]).map(track => (
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
            </div>,
            document.body
          )}
        </div>

        {/* Import / Export */}
        <div className={styles.ioGroup}>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
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
              onClick={handleExport}
            >
              <Download size={13} />
              Export
            </button>
          </Tooltip>
        </div>
      </nav>

      {view === 'plan' && <DegreePlanPage year={year} />}
      {view === 'semA' && <SemesterPage semesterId={activeSems[0]} />}
      {view === 'semB' && <SemesterPage semesterId={activeSems[1]} />}
    </div>
  )
}
