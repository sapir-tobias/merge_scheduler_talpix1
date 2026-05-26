import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from './lib/utils'
import SemesterPage from './pages/SemesterPage'
import DegreePlanPage from './pages/DegreePlanPage'
import { DegreeProvider, useDegree } from './stores/DegreeContext'
import { CoursesProvider, useCoursesStore } from './stores/CoursesStore'
import Tooltip from './components/Tooltip'
import { Download, Upload, Ban, BookOpen } from 'lucide-react'
import type { SemesterId, PlanYear, DayKey, TrackId } from './types'

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
const TRACK_DOT: Record<TrackId, string> = {
  cs:      'bg-blue-400',
  math:    'bg-violet-400',
  physics: 'bg-amber-400',
}

function Inner() {
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
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      <nav className="flex items-center h-12 bg-white border-b border-stone-200 px-6 shrink-0 gap-4">
        <span className="text-sm font-bold tracking-tight text-stone-900 shrink-0">
          Degree Planner
        </span>

        {/* View tabs */}
        <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={cn(
                'px-3 py-1 text-[12px] font-medium rounded-md transition-all whitespace-nowrap',
                view === tab.id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-stone-400 font-medium">Year</span>
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5 gap-0.5">
            {([1, 2, 3] as PlanYear[]).map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={cn(
                  'w-7 py-1 text-[12px] font-semibold rounded-md transition-all',
                  year === y
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />

        {/* Block button */}
        <div className="flex items-center gap-1 relative">
          <Tooltip text="Add a time blocker" side="bottom">
            <button
              ref={blockerBtnRef}
              data-blocker-popover
              onClick={() => setBlockerOpen(o => !o)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors',
                blockerOpen
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              )}
            >
              <Ban size={12} />
              Block
            </button>
          </Tooltip>

          {blockerOpen && blockerBtnRect && createPortal(
            <div
              data-blocker-popover
              className="fixed z-50 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 w-64"
              style={{ top: blockerBtnRect.bottom + 8, right: window.innerWidth - blockerBtnRect.right }}
            >
              <p className="text-[11px] font-bold text-stone-700 mb-3">Add time blocker</p>

              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] text-stone-400 mb-1">Day</p>
                  <div className="flex gap-1">
                    {DAYS_LIST.map(d => (
                      <button
                        key={d.key}
                        onClick={() => setNewBlocker(nb => ({ ...nb, day: d.key }))}
                        className={cn(
                          'flex-1 text-[10px] font-semibold py-1 rounded-md transition-colors',
                          newBlocker.day === d.key
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        )}
                      >
                        {d.label.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-stone-400 mb-1">
                    From — <span className="text-stone-600 font-medium">{formatTime(newBlocker.startHour)}</span>
                  </p>
                  <input
                    type="range" min={8} max={19.5} step={0.5}
                    value={newBlocker.startHour}
                    onChange={e => setNewBlocker(nb => ({ ...nb, startHour: +e.target.value, endHour: Math.max(+e.target.value + 0.5, nb.endHour) }))}
                    className="w-full h-1 accent-stone-800"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-stone-400 mb-1">
                    To — <span className="text-stone-600 font-medium">{formatTime(newBlocker.endHour)}</span>
                  </p>
                  <input
                    type="range" min={newBlocker.startHour + 0.5} max={20} step={0.5}
                    value={newBlocker.endHour}
                    onChange={e => setNewBlocker(nb => ({ ...nb, endHour: +e.target.value }))}
                    className="w-full h-1 accent-stone-800"
                  />
                </div>

                <div>
                  <p className="text-[10px] text-stone-400 mb-1">Label (optional)</p>
                  <input
                    type="text"
                    value={blockerLabel}
                    onChange={e => setBlockerLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddBlocker()}
                    placeholder="e.g. Gym, Class, Sleep…"
                    className="w-full text-[11px] border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-700 focus:outline-none focus:border-stone-400 placeholder:text-stone-300"
                  />
                </div>

                <button
                  onClick={handleAddBlocker}
                  className="w-full py-1.5 bg-stone-900 text-white text-[11px] font-medium rounded-lg hover:bg-stone-700 transition-colors"
                >
                  Add blocker
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Load Plan button */}
        <div className="flex items-center gap-1 relative">
          <Tooltip text="Load a default degree track" side="bottom">
            <button
              ref={loadPlanBtnRef}
              data-load-plan-popover
              onClick={() => setLoadPlanOpen(o => !o)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors',
                loadPlanOpen
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              )}
            >
              <BookOpen size={12} />
              Load Plan
            </button>
          </Tooltip>

          {loadPlanOpen && loadPlanBtnRect && createPortal(
            <div
              data-load-plan-popover
              className="fixed z-50 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 w-72"
              style={{ top: loadPlanBtnRect.bottom + 8, right: window.innerWidth - loadPlanBtnRect.right }}
            >
              <p className="text-[11px] font-bold text-stone-700 mb-1">Load Default Plan</p>
              <p className="text-[10px] text-stone-400 mb-3">
                Replaces your current plan. Exempt courses are skipped automatically.
              </p>

              <div className="space-y-2">
                {(['cs', 'math', 'physics'] as TrackId[]).map(track => (
                  <button
                    key={track}
                    data-testid={`load-plan-${track}`}
                    onClick={() => handleLoadPlan(track)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg border border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-colors text-left"
                  >
                    <div className={cn('mt-1 w-2 h-2 rounded-full shrink-0', TRACK_DOT[track])} />
                    <div>
                      <p className="text-[11px] font-semibold text-stone-800">{TRACK_LABEL[track]}</p>
                      <p className="text-[10px] text-stone-400">{TRACK_DESC[track]}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>

        {/* Import / Export */}
        <div className="flex items-center gap-1">
          <Tooltip text="Import from XLSX" side="bottom">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors">
              <Upload size={13} />
              Import
            </button>
          </Tooltip>
          <Tooltip text="Export to XLSX" side="bottom">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors">
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

function AppShell() {
  const { initialPlaced, isLoading } = useCoursesStore()

  if (isLoading) {
    return (
      <div
        data-testid="app-loading"
        className="flex items-center justify-center h-screen bg-stone-50 text-stone-500 text-sm"
      >
        Loading scheduler…
      </div>
    )
  }

  return (
    <DegreeProvider initialPlaced={initialPlaced}>
      <Inner />
    </DegreeProvider>
  )
}

export default function App() {
  return (
    <CoursesProvider>
      <AppShell />
    </CoursesProvider>
  )
}
