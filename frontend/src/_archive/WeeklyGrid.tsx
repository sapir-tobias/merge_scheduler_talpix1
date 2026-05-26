import { cn } from '../lib/utils'

const DAYS = [
  { key: 'sun', label: 'Sun' },
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
]

const DAY_OF_WEEK = ['sun','mon','tue','wed','thu','fri','sat']
const HOUR_SLOTS  = Array.from({ length: 12 }, (_, i) => i + 8)

function formatHour(h: number) {
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export default function WeeklyGrid() {
  const todayKey = DAY_OF_WEEK[new Date().getDay()]
  const isActive = (key: string) => key === todayKey && DAYS.some(d => d.key === key)

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">

      {/* ── Header row — h-11 aligns with calendar and right-panel headers ── */}
      <div className="flex shrink-0 h-11 border-b border-stone-200">
        {/* Gutter spacer */}
        <div className="w-14 shrink-0" />

        {DAYS.map((day, i) => (
          <div
            key={day.key}
            className={cn(
              'flex-1 flex items-center justify-center border-l border-stone-200',
              isActive(day.key) ? 'bg-stone-100/60' : ''
            )}
          >
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-[0.12em]',
              isActive(day.key) ? 'text-stone-700' : 'text-stone-400'
            )}>
              {day.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Hour grid — fills remaining height exactly ── */}
      <div
        className="flex-1 grid overflow-hidden"
        style={{ gridTemplateRows: 'repeat(12, 1fr)' }}
      >
        {HOUR_SLOTS.map(h => (
          <div key={h} className="flex min-h-0 border-b border-stone-100">

            {/* Time label */}
            <div className="w-14 shrink-0 flex items-start justify-end pr-2.5 pt-1.5 select-none">
              <span className="text-[10px] leading-none text-stone-400 tabular-nums font-medium">
                {formatHour(h)}
              </span>
            </div>

            {/* Day cells */}
            {DAYS.map((day, i) => (
              <div
                key={day.key}
                className={cn(
                  'flex-1 relative border-l',
                  i === 0 ? 'border-stone-200' : 'border-stone-100',
                  isActive(day.key) ? 'bg-stone-50/80' : 'hover:bg-stone-50/40 transition-colors'
                )}
              >
                {/* 30-min dashed mark */}
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-stone-100" />
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  )
}
