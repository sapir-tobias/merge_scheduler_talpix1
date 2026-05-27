import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/utils'
import SemesterPage from './SemesterPage'
import DegreePlanPage from './DegreePlanPage'
import { useDegree } from '../stores/DegreeContext'
import { useCoursesStore } from '../stores/CoursesStore'
import Tooltip from '../components/Tooltip'
import BlockerPopover from '../components/scheduler/BlockerPopover'
import LoadPlanPopover from '../components/scheduler/LoadPlanPopover'
import SchedulerIOButtons from '../components/scheduler/SchedulerIOButtons'
import { Ban, BookOpen } from 'lucide-react'
import { TEST_IDS } from '../testIds'
import { PLAN_YEARS } from '../constants'
import { useDismissOnOutsideClick } from '../lib/useDismissOnOutsideClick'
import styles from './SchedulerPage.module.css'

const TAB_TEST_ID = {
  plan: TEST_IDS.NAV.TAB_PLAN,
  semA: TEST_IDS.NAV.TAB_SEM_A,
  semB: TEST_IDS.NAV.TAB_SEM_B,
}

export default function SchedulerPage() {
  const { state, dispatch } = useDegree()
  const { fetchPlan } = useCoursesStore()
  const [view, setView] = useState('plan')
  const [year, setYear] = useState(1)

  // Blocker popover
  const [blockerOpen, setBlockerOpen] = useState(false)
  const [newBlocker, setNewBlocker] = useState({ day: 'sun', startHour: 9, endHour: 11 })
  const [blockerLabel, setBlockerLabel] = useState('')
  const blockerBtnRef = useRef(null)

  // Load Plan popover
  const [loadPlanOpen, setLoadPlanOpen] = useState(false)
  const loadPlanBtnRef = useRef(null)

  const activeSems =
    year === 1 ? [1, 2] : year === 2 ? [3, 4] : [5, 6]

  const TABS = [
    { id: 'plan', label: 'Degree Plan' },
    { id: 'semA', label: `Semester ${activeSems[0]}` },
    { id: 'semB', label: `Semester ${activeSems[1]}` },
  ]

  function handleAddBlocker() {
    if (newBlocker.endHour <= newBlocker.startHour) return
    const semId = view === 'semB' ? activeSems[1] : activeSems[0]
    dispatch({ type: 'ADD_BLOCKER', payload: { id: `b-${Date.now()}`, label: blockerLabel || undefined, ...newBlocker, semesterId: semId } })
    setBlockerLabel('')
    setBlockerOpen(false)
  }

  async function handleLoadPlan(track) {
    const entries = await fetchPlan(track)
    const placed = entries
      .filter(e => !state.exemptions.includes(e.courseId))
      .map(e => ({ ...e, locked: false }))
    dispatch({ type: 'LOAD_PLAN', placed })
    setLoadPlanOpen(false)
  }

  // Dismiss popovers on outside click
  useDismissOnOutsideClick(blockerOpen, '[data-blocker-popover]', () => setBlockerOpen(false))
  useDismissOnOutsideClick(loadPlanOpen, '[data-load-plan-popover]', () => setLoadPlanOpen(false))

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
            {PLAN_YEARS.map(y => (
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
            <BlockerPopover
              blockerBtnRect={blockerBtnRect}
              newBlocker={newBlocker}
              setNewBlocker={setNewBlocker}
              blockerLabel={blockerLabel}
              setBlockerLabel={setBlockerLabel}
              handleAddBlocker={handleAddBlocker}
            />,
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
            <LoadPlanPopover
              loadPlanBtnRect={loadPlanBtnRect}
              handleLoadPlan={handleLoadPlan}
            />,
            document.body
          )}
        </div>

        {/* Import / Export */}
        <SchedulerIOButtons state={state} dispatch={dispatch} styles={styles} />
      </nav>

      {view === 'plan' && <DegreePlanPage year={year} />}
      {view === 'semA' && <SemesterPage semesterId={activeSems[0]} />}
      {view === 'semB' && <SemesterPage semesterId={activeSems[1]} />}
    </div>
  )
}
